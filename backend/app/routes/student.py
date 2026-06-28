import secrets

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user, require_student
from app.database import get_connection
from app.routes.common import (
    application_dates,
    application_row,
    checklist_for_application,
    create_internship_id,
    dashboard_for_user,
    dump_model,
    ensure_application_access,
    ensure_default_tasks,
    latest_payment,
    linkedin_complete,
    tasks_for_application,
)
from app.schemas import ApplicationRequest, ChecklistUpdate, FinalProjectUpdate
from app.utils.email import log_email_event


router = APIRouter(tags=["student workflow"])


@router.get("/students/dashboard")
def student_dashboard(user: dict = Depends(get_current_user)) -> dict:
    return dashboard_for_user(user)


@router.post("/applications", status_code=status.HTTP_201_CREATED)
def create_application(payload: ApplicationRequest, user: dict = Depends(require_student)) -> dict:
    with get_connection() as conn:
        domain = conn.execute(
            "SELECT id, fee, duration_weeks FROM internship_domains WHERE id = ?",
            (payload.domain_id,),
        ).fetchone()
        if domain is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found")
        start_date, end_date = application_dates(domain["duration_weeks"])
        draft_id = f"LYTIX-INT-DRAFT-{secrets.token_hex(4).upper()}"
        cursor = conn.execute(
            """
            INSERT INTO applications
                (student_id, domain_id, internship_id, statement, skills, linkedin_url, start_date, end_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                payload.domain_id,
                draft_id,
                payload.statement.strip(),
                payload.skills or "",
                payload.linkedin_url or "",
                start_date,
                end_date,
            ),
        )
        application_id = cursor.lastrowid
        internship_id = create_internship_id(application_id)
        conn.execute(
            "UPDATE applications SET internship_id = ? WHERE id = ?",
            (internship_id, application_id),
        )
        conn.execute(
            """
            INSERT INTO payments (application_id, amount, status)
            VALUES (?, ?, 'Pending')
            """,
            (application_id, domain["fee"]),
        )
        conn.execute(
            "INSERT INTO linkedin_checklist (application_id) VALUES (?)",
            (application_id,),
        )
        log_email_event(
            conn,
            email_type="new_application_alert",
            recipient_email="admin@lytix.tech",
            subject=f"New LYTIX application: {internship_id}",
            user_id=user["id"],
            application_id=application_id,
            metadata={"internship_id": internship_id, "domain_id": payload.domain_id},
        )
    ensure_default_tasks(application_id, payload.domain_id)
    return application_row(application_id)


@router.get("/applications/me")
def my_applications(user: dict = Depends(get_current_user)) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id FROM applications WHERE student_id = ? ORDER BY created_at DESC",
            (user["id"],),
        ).fetchall()
    return [application_row(row["id"]) for row in rows]


@router.get("/applications/{application_id}/status")
def view_application_status(application_id: int, user: dict = Depends(get_current_user)) -> dict:
    application = ensure_application_access(application_id, user)
    return {
        "application_id": application["id"],
        "internship_id": application["internship_id"],
        "status": application["status"],
        "decision": application["decision"],
        "payment_status": application["payment_status"],
        "project_status": application["project_status"],
    }


@router.post("/applications/{application_id}/payment")
def create_payment_order(application_id: int, user: dict = Depends(get_current_user)) -> dict:
    application = ensure_application_access(application_id, user)
    order_id = f"order_lytix_{secrets.token_hex(6)}"
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO payments (application_id, order_id, amount, status)
            VALUES (?, ?, ?, 'Order Created')
            """,
            (application_id, order_id, application["domain"]["fee"]),
        )
        conn.execute(
            """
            UPDATE applications
            SET status = 'Payment', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (application_id,),
        )
    return {
        "provider": "razorpay-placeholder",
        "order_id": order_id,
        "amount": application["domain"]["fee"] * 100,
        "currency": "INR",
        "message": "Mock Razorpay order created. Use payment success to complete the MVP payment.",
    }


@router.post("/applications/{application_id}/payment/mock-success")
def mock_payment_success(application_id: int, user: dict = Depends(get_current_user)) -> dict:
    application = ensure_application_access(application_id, user)
    payment = latest_payment(application_id)
    with get_connection() as conn:
        if payment:
            conn.execute(
                """
                UPDATE payments
                SET status = 'Paid', paid_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (payment["id"],),
            )
        else:
            conn.execute(
                """
                INSERT INTO payments (application_id, amount, status, paid_at)
                VALUES (?, ?, 'Paid', CURRENT_TIMESTAMP)
                """,
                (application_id, application["domain"]["fee"]),
            )
        conn.execute(
            """
            UPDATE applications
            SET status = 'Offer Letter', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (application_id,),
        )
        log_email_event(
            conn,
            email_type="payment_confirmation",
            recipient_email=user["email"],
            subject="LYTIX payment confirmation",
            user_id=user["id"],
            application_id=application_id,
            metadata={"payment_status": "Paid", "source": "mock_success"},
        )
        log_email_event(
            conn,
            email_type="internship_activation",
            recipient_email=user["email"],
            subject="Your LYTIX internship is active",
            user_id=user["id"],
            application_id=application_id,
            metadata={"payment_status": "Paid"},
        )
    return {"status": "Paid", "message": "Mock payment marked as completed."}


@router.get("/applications/{application_id}/tasks")
def view_assigned_tasks(application_id: int, user: dict = Depends(get_current_user)) -> list[dict]:
    ensure_application_access(application_id, user)
    return tasks_for_application(application_id)


@router.patch("/applications/{application_id}/final-project")
def submit_project_link(
    application_id: int,
    payload: FinalProjectUpdate,
    user: dict = Depends(get_current_user),
) -> dict:
    ensure_application_access(application_id, user)
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE applications
            SET final_project_url = ?, project_status = 'Submitted',
                status = 'Final Project', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (payload.final_project_url, application_id),
        )
    return application_row(application_id)


@router.patch("/applications/{application_id}/checklist")
def update_linkedin_checklist(
    application_id: int,
    payload: ChecklistUpdate,
    user: dict = Depends(get_current_user),
) -> dict:
    ensure_application_access(application_id, user)
    updates = dump_model(payload)
    if not updates:
        return checklist_for_application(application_id)
    assignments = ", ".join([f"{key} = ?" for key in updates])
    values = [1 if value else 0 for value in updates.values()]
    with get_connection() as conn:
        conn.execute(
            f"""
            UPDATE linkedin_checklist
            SET {assignments}, updated_at = CURRENT_TIMESTAMP
            WHERE application_id = ?
            """,
            (*values, application_id),
        )
        checklist = checklist_for_application(application_id)
        if linkedin_complete(application_id):
            conn.execute(
                """
                UPDATE applications
                SET status = CASE WHEN status != 'Certificate' THEN 'LinkedIn Update' ELSE status END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (application_id,),
            )
    return checklist_for_application(application_id)
