import secrets
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.database import get_connection, row_to_dict
from app.schemas import SupportTicketCreate, SupportTicketMessageCreate, SupportTicketUpdate
from app.utils.email import log_email_event


router = APIRouter(prefix="/support", tags=["support"])

SUPPORT_CATEGORIES = {
    "student": [
        "Payment Issues",
        "Certificate Issues",
        "Login Problems",
        "Internship Questions",
        "Assignment Queries",
    ],
    "recruiter": ["Candidate Issues", "Job Posting Issues"],
    "hr": ["Onboarding Issues", "Application Management"],
    "mentor": ["Student Progress", "Project Review", "Assignment Queries"],
    "admin": ["Platform Operations", "Certificate Requests", "Support Ticket Notifications"],
    "super_admin": ["Platform Operations", "Role Management", "System Health"],
}


@router.get("/options")
def support_options(user: dict = Depends(get_current_user)) -> dict:
    return {
        "categories": SUPPORT_CATEGORIES.get(user["role"], SUPPORT_CATEGORIES["student"]),
        "all_categories": sorted({item for rows in SUPPORT_CATEGORIES.values() for item in rows}),
        "priorities": ["Low", "Medium", "High", "Urgent"],
        "statuses": ["Open", "Assigned", "In Progress", "Resolved", "Closed"],
    }


@router.get("/tickets")
def list_tickets(user: dict = Depends(get_current_user)) -> list[dict]:
    admin = _is_admin(user)
    with get_connection() as conn:
        if admin:
            rows = conn.execute(
                """
                SELECT support_tickets.*, creator.name AS creator_name, creator.email AS creator_email,
                    assignee.name AS assigned_to_name
                FROM support_tickets
                JOIN users AS creator ON creator.id = support_tickets.created_by
                LEFT JOIN users AS assignee ON assignee.id = support_tickets.assigned_to
                ORDER BY support_tickets.updated_at DESC, support_tickets.id DESC
                """
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT support_tickets.*, creator.name AS creator_name, creator.email AS creator_email,
                    assignee.name AS assigned_to_name
                FROM support_tickets
                JOIN users AS creator ON creator.id = support_tickets.created_by
                LEFT JOIN users AS assignee ON assignee.id = support_tickets.assigned_to
                WHERE support_tickets.created_by = ?
                ORDER BY support_tickets.updated_at DESC, support_tickets.id DESC
                """,
                (user["id"],),
            ).fetchall()
    return [_ticket_payload(dict(row), include_messages=False) for row in rows]


@router.post("/tickets", status_code=status.HTTP_201_CREATED)
def create_ticket(payload: SupportTicketCreate, user: dict = Depends(get_current_user)) -> dict:
    ticket_id = _ticket_id()
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO support_tickets
                (ticket_id, created_by, category, subject, description, priority, status, attachment_url)
            VALUES (?, ?, ?, ?, ?, ?, 'Open', ?)
            """,
            (
                ticket_id,
                user["id"],
                payload.category,
                payload.subject,
                payload.description,
                payload.priority,
                payload.attachment_url or "",
            ),
        )
        conn.execute(
            """
            INSERT INTO support_ticket_messages (ticket_id, sender_id, message, attachment_url)
            VALUES (?, ?, ?, ?)
            """,
            (cursor.lastrowid, user["id"], payload.description, payload.attachment_url or ""),
        )
        log_email_event(
            conn,
            email_type="support_ticket_created",
            recipient_email=user["email"],
            subject=f"Support ticket created: {ticket_id}",
            user_id=user["id"],
            metadata={"ticket_id": ticket_id, "category": payload.category, "priority": payload.priority},
        )
        for admin_email in _admin_emails(conn):
            log_email_event(
                conn,
                email_type="support_ticket_notification",
                recipient_email=admin_email,
                subject=f"New support ticket: {ticket_id}",
                user_id=user["id"],
                metadata={"ticket_id": ticket_id, "category": payload.category, "priority": payload.priority},
            )
        row = _ticket_row(conn, ticket_id)
    return _ticket_payload(row)


@router.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: str, user: dict = Depends(get_current_user)) -> dict:
    with get_connection() as conn:
        ticket = _ticket_row(conn, ticket_id)
        _ensure_ticket_access(ticket, user)
        return _ticket_payload(ticket, messages=_ticket_messages(conn, ticket["id"]))


@router.patch("/tickets/{ticket_id}")
def update_ticket(ticket_id: str, payload: SupportTicketUpdate, user: dict = Depends(get_current_user)) -> dict:
    with get_connection() as conn:
        ticket = _ticket_row(conn, ticket_id)
        if not _is_admin(user):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin response access required")
        updates = payload.model_dump(exclude_unset=True)
        if not updates:
            return _ticket_payload(ticket, messages=_ticket_messages(conn, ticket["id"]))
        assignments = ", ".join([f"{key} = ?" for key in updates])
        conn.execute(
            f"""
            UPDATE support_tickets
            SET {assignments}, updated_at = CURRENT_TIMESTAMP
            WHERE ticket_id = ?
            """,
            (*updates.values(), ticket_id),
        )
        if payload.resolution_notes:
            conn.execute(
                """
                INSERT INTO support_ticket_messages (ticket_id, sender_id, message)
                VALUES (?, ?, ?)
                """,
                (ticket["id"], user["id"], payload.resolution_notes),
            )
        updated = _ticket_row(conn, ticket_id)
        log_email_event(
            conn,
            email_type="support_ticket_updated",
            recipient_email=updated["creator_email"],
            subject=f"Support ticket updated: {ticket_id}",
            user_id=updated["created_by"],
            metadata={"ticket_id": ticket_id, "status": updated["status"], "priority": updated["priority"]},
        )
        return _ticket_payload(updated, messages=_ticket_messages(conn, updated["id"]))


@router.post("/tickets/{ticket_id}/messages", status_code=status.HTTP_201_CREATED)
def add_ticket_message(
    ticket_id: str,
    payload: SupportTicketMessageCreate,
    user: dict = Depends(get_current_user),
) -> dict:
    with get_connection() as conn:
        ticket = _ticket_row(conn, ticket_id)
        _ensure_ticket_access(ticket, user)
        cursor = conn.execute(
            """
            INSERT INTO support_ticket_messages (ticket_id, sender_id, message, attachment_url)
            VALUES (?, ?, ?, ?)
            """,
            (ticket["id"], user["id"], payload.message, payload.attachment_url or ""),
        )
        conn.execute(
            "UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (ticket["id"],),
        )
        recipient = ticket["creator_email"] if _is_admin(user) else _primary_admin_email(conn)
        log_email_event(
            conn,
            email_type="support_ticket_message",
            recipient_email=recipient,
            subject=f"New support ticket message: {ticket_id}",
            user_id=ticket["created_by"],
            metadata={"ticket_id": ticket_id, "sender_role": user["role"]},
        )
        row = conn.execute(
            """
            SELECT support_ticket_messages.*, users.name AS sender_name, users.role AS sender_role
            FROM support_ticket_messages
            JOIN users ON users.id = support_ticket_messages.sender_id
            WHERE support_ticket_messages.id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()
    return dict(row)


@router.get("/analytics")
def support_analytics(user: dict = Depends(get_current_user)) -> dict:
    if not _is_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin support analytics required")
    with get_connection() as conn:
        totals = conn.execute(
            """
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status IN ('Open', 'Assigned', 'In Progress') THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved,
                SUM(CASE WHEN priority IN ('High', 'Urgent') THEN 1 ELSE 0 END) AS priority
            FROM support_tickets
            """
        ).fetchone()
        status_rows = conn.execute(
            "SELECT status, COUNT(*) AS count FROM support_tickets GROUP BY status ORDER BY count DESC"
        ).fetchall()
    return {"metrics": dict(totals), "by_status": [dict(row) for row in status_rows]}


def _ticket_id() -> str:
    return f"LYTIX-TKT-{date.today().strftime('%Y%m%d')}-{secrets.token_hex(2).upper()}"


def _is_admin(user: dict[str, Any]) -> bool:
    return user["role"] in ("admin", "super_admin")


def _ensure_ticket_access(ticket: dict[str, Any], user: dict[str, Any]) -> None:
    if _is_admin(user):
        return
    if ticket["created_by"] == user["id"]:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ticket access denied")


def _ticket_row(conn, ticket_id: str) -> dict[str, Any]:
    row = row_to_dict(
        conn.execute(
            """
            SELECT support_tickets.*, creator.name AS creator_name, creator.email AS creator_email,
                creator.role AS creator_role, assignee.name AS assigned_to_name
            FROM support_tickets
            JOIN users AS creator ON creator.id = support_tickets.created_by
            LEFT JOIN users AS assignee ON assignee.id = support_tickets.assigned_to
            WHERE support_tickets.ticket_id = ?
            """,
            (ticket_id,),
        ).fetchone()
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Support ticket not found")
    return row


def _ticket_messages(conn, ticket_pk: int) -> list[dict]:
    rows = conn.execute(
        """
        SELECT support_ticket_messages.*, users.name AS sender_name, users.role AS sender_role
        FROM support_ticket_messages
        JOIN users ON users.id = support_ticket_messages.sender_id
        WHERE support_ticket_messages.ticket_id = ?
        ORDER BY support_ticket_messages.created_at, support_ticket_messages.id
        """,
        (ticket_pk,),
    ).fetchall()
    return [dict(row) for row in rows]


def _ticket_payload(ticket: dict[str, Any], messages: list[dict] | None = None, include_messages: bool = True) -> dict:
    payload = {
        **ticket,
        "messages": messages or [] if include_messages else [],
    }
    return payload


def _admin_emails(conn) -> list[str]:
    rows = conn.execute(
        "SELECT email FROM users WHERE role IN ('admin', 'super_admin') ORDER BY role, id"
    ).fetchall()
    return [row["email"] for row in rows] or ["admin@lytix.tech"]


def _primary_admin_email(conn) -> str:
    emails = _admin_emails(conn)
    return emails[0] if emails else "admin@lytix.tech"

