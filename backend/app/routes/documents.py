import os
import secrets
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user, require_admin
from app.database import get_connection, row_to_dict
from app.routes.common import (
    application_row,
    ensure_application_access,
    linkedin_complete,
    offer_letter_id,
    project_approved,
    require_payment_completed,
)
from app.schemas import DocumentGenerateRequest, DocumentRevokeRequest
from app.utils.pdf_generator import (
    build_certificate,
    build_experience_letter,
    build_lor,
    build_offer_letter,
)
from app.utils.email import log_email_event
from app.utils.responses import pdf_response


router = APIRouter(prefix="/documents", tags=["documents"])
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
VERIFICATION_PORTAL_URL = os.getenv("VERIFICATION_PORTAL_URL", "https://verify.lytixtechnologies.com").rstrip("/")


@router.get("/eligibility/me")
def my_certificate_eligibility(user: dict = Depends(get_current_user)) -> dict:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM applications WHERE student_id = ? ORDER BY created_at DESC LIMIT 1",
            (user["id"],),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return document_eligibility(application_row(row["id"]))


@router.get("/eligibility/{application_id}")
def check_certificate_eligibility(
    application_id: int,
    user: dict = Depends(get_current_user),
) -> dict:
    application = ensure_application_access(application_id, user)
    return document_eligibility(application)


@router.post("/offer-letter/{application_id}")
def offer_letter(application_id: int, user: dict = Depends(get_current_user)):
    application = ensure_application_access(application_id, user)
    require_payment_completed(application)
    document = issue_document(application, "offer_letter")
    pdf = build_offer_letter(
        {**application, "verification_url": document["verification_url"]},
        document["verification_id"],
        application.get("certificate", {}).get("certificate_id") if application.get("certificate") else None,
    )
    _log_document_email(application, document, "offer_letter_delivery", "Your LYTIX offer letter is ready")
    return pdf_response(pdf, f"{document['verification_id']}.pdf")


@router.post("/certificate/{application_id}")
def certificate(application_id: int, user: dict = Depends(get_current_user)):
    application = ensure_application_access(application_id, user)
    eligibility = document_eligibility(application)
    if not eligibility["certificate_eligible"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Certificate eligibility requirements are not complete",
        )
    document = issue_document(application, "certificate")
    _sync_certificate_table(application, document)
    pdf = build_certificate(application_row(application_id), document["verification_id"], document["verification_url"])
    _log_document_email(application, document, "certificate_delivery", "Your LYTIX certificate is ready")
    return pdf_response(pdf, f"{document['verification_id']}.pdf")


@router.post("/experience-letter/{application_id}")
def experience_letter(
    application_id: int,
    payload: DocumentGenerateRequest | None = None,
    user: dict = Depends(get_current_user),
):
    application = ensure_application_access(application_id, user)
    eligibility = document_eligibility(application)
    if not eligibility["certificate_eligible"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Experience letter requires completed internship eligibility",
        )
    document = issue_document(application, "experience_letter")
    pdf = build_experience_letter(
        application,
        document["verification_id"],
        document["verification_url"],
        payload.work_summary if payload else "",
        payload.performance_rating if payload else "Excellent",
    )
    _log_document_email(application, document, "experience_letter_delivery", "Your LYTIX experience letter is ready")
    return pdf_response(pdf, f"{document['verification_id']}.pdf")


@router.post("/lor/{application_id}")
def letter_of_recommendation(
    application_id: int,
    payload: DocumentGenerateRequest | None = None,
    user: dict = Depends(get_current_user),
):
    application = ensure_application_access(application_id, user)
    eligibility = document_eligibility(application)
    if not eligibility["lor_eligible"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="LOR is available only for top performers",
        )
    document = issue_document(application, "lor")
    pdf = build_lor(
        application,
        document["verification_id"],
        document["verification_url"],
        payload.performance_rating if payload else "Outstanding",
    )
    _log_document_email(application, document, "lor_delivery", "Your LYTIX letter of recommendation is ready")
    return pdf_response(pdf, f"{document['verification_id']}.pdf")


@router.get("/me")
def get_student_documents(user: dict = Depends(get_current_user)) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT documents.*, applications.internship_id, internship_domains.name AS domain_name
            FROM documents
            JOIN applications ON applications.id = documents.application_id
            JOIN internship_domains ON internship_domains.id = applications.domain_id
            WHERE documents.student_id = ?
            ORDER BY documents.issue_date DESC, documents.id DESC
            """,
            (user["id"],),
        ).fetchall()
    return [_document_payload(dict(row)) for row in rows]


@router.get("")
def get_all_issued_documents(_: dict = Depends(require_admin)) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                documents.*,
                users.name AS student_name,
                applications.internship_id,
                internship_domains.name AS domain_name
            FROM documents
            JOIN users ON users.id = documents.student_id
            JOIN applications ON applications.id = documents.application_id
            JOIN internship_domains ON internship_domains.id = applications.domain_id
            ORDER BY documents.issue_date DESC, documents.id DESC
            """
        ).fetchall()
    return [_document_payload(dict(row)) for row in rows]


@router.get("/{verification_id}/download")
def download_document(verification_id: str, user: dict = Depends(get_current_user)):
    document = get_document_by_verification(verification_id)
    if user["role"] != "admin" and document["student_id"] != user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if document["status"] == "Revoked":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Document has been revoked")
    application = application_row(document["application_id"])
    pdf = build_document_pdf(application, document)
    return pdf_response(pdf, f"{document['verification_id']}.pdf")


@router.get("/verify/{verification_id}")
def verify_document_by_id(verification_id: str) -> dict:
    document = get_document_by_verification(verification_id)
    return {"valid": document["status"] == "Issued", "document": _document_payload(document)}


@router.patch("/{verification_id}/revoke")
def revoke_document(
    verification_id: str,
    payload: DocumentRevokeRequest,
    _: dict = Depends(require_admin),
) -> dict:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            UPDATE documents
            SET status = 'Revoked', revoked_reason = ?
            WHERE verification_id = ?
            """,
            (payload.reason, verification_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        document = conn.execute(
            "SELECT * FROM documents WHERE verification_id = ?", (verification_id,)
        ).fetchone()
    return _document_payload(dict(document))


def document_eligibility(application: dict[str, Any]) -> dict[str, Any]:
    require_payment = application["payment_status"] == "Paid"
    attendance = attendance_percentage(application["student_id"])
    assignment_completion = assignment_completion_percentage(
        application["student_id"], application["domain"]["id"]
    )
    project = latest_project_submission(application["student_id"], application["domain"]["id"])
    project_is_approved = bool(project and project["status"] == "approved")
    project_marks = project["marks"] if project else None
    linkedin_done = linkedin_complete(application["id"])
    certificate_eligible = all(
        [
            require_payment,
            attendance >= 70,
            assignment_completion >= 100,
            project_is_approved,
            linkedin_done,
        ]
    )
    lor_eligible = attendance > 85 and (project_marks or 0) > 80 and assignment_completion > 90
    return {
        "application_id": application["id"],
        "payment_completed": require_payment,
        "attendance_percentage": attendance,
        "attendance_minimum_met": attendance >= 70,
        "assignment_completion": assignment_completion,
        "assignments_completed": assignment_completion >= 100,
        "project_approved": project_is_approved,
        "project_marks": project_marks,
        "linkedin_completed": linkedin_done,
        "certificate_eligible": certificate_eligible,
        "lor_eligible": lor_eligible,
    }


def issue_document(application: dict[str, Any], document_type: str) -> dict[str, Any]:
    with get_connection() as conn:
        existing = row_to_dict(
            conn.execute(
                """
                SELECT * FROM documents
                WHERE application_id = ? AND document_type = ? AND status != 'Revoked'
                ORDER BY id DESC
                LIMIT 1
                """,
                (application["id"], document_type),
            ).fetchone()
        )
        if existing:
            return _with_verification_url(existing)

        verification_id = document_id(document_type, application["id"])
        conn.execute(
            """
            INSERT INTO documents
                (application_id, student_id, document_type, document_number, verification_id, issue_date, status, pdf_path)
            VALUES (?, ?, ?, ?, ?, ?, 'Issued', ?)
            """,
            (
                application["id"],
                application["student_id"],
                document_type,
                verification_id,
                verification_id,
                date.today().isoformat(),
                f"generated/{verification_id}.pdf",
            ),
        )
        row = row_to_dict(
            conn.execute(
                "SELECT * FROM documents WHERE verification_id = ?", (verification_id,)
            ).fetchone()
        )
    return _with_verification_url(row)


def document_id(document_type: str, application_id: int) -> str:
    prefixes = {
        "offer_letter": "LYTIX-OFFER",
        "certificate": "LYTIX-CERT",
        "experience_letter": "LYTIX-EXP",
        "lor": "LYTIX-LOR",
    }
    suffix = secrets.token_hex(2).upper()
    return f"{prefixes[document_type]}-{date.today().strftime('%Y%m%d')}-{application_id:04d}-{suffix}"


def get_document_by_verification(verification_id: str) -> dict[str, Any]:
    with get_connection() as conn:
        document = row_to_dict(
            conn.execute(
                """
                SELECT
                    documents.*,
                    users.name AS student_name,
                    users.email AS student_email,
                    users.college,
                    applications.internship_id,
                    applications.start_date,
                    applications.end_date,
                    internship_domains.name AS domain_name,
                    internship_domains.duration_weeks
                FROM documents
                JOIN users ON users.id = documents.student_id
                JOIN applications ON applications.id = documents.application_id
                JOIN internship_domains ON internship_domains.id = applications.domain_id
                WHERE documents.verification_id = ?
                """,
                (verification_id,),
            ).fetchone()
        )
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return _with_verification_url(document)


def build_document_pdf(application: dict[str, Any], document: dict[str, Any]) -> bytes:
    doc_type = document["document_type"]
    if doc_type == "certificate":
        return build_certificate(application, document["verification_id"], document["verification_url"])
    if doc_type == "experience_letter":
        return build_experience_letter(
            application,
            document["verification_id"],
            document["verification_url"],
            "Completed assigned internship tasks, learning modules, weekly assignments, and final project delivery.",
            "Excellent",
        )
    if doc_type == "lor":
        return build_lor(application, document["verification_id"], document["verification_url"], "Outstanding")
    return build_offer_letter(application, document["verification_id"], None)


def _sync_certificate_table(application: dict[str, Any], document: dict[str, Any]) -> None:
    with get_connection() as conn:
        existing = conn.execute(
            "SELECT id FROM certificates WHERE application_id = ?", (application["id"],)
        ).fetchone()
        if existing:
            conn.execute(
                """
                UPDATE certificates
                SET certificate_id = ?, issue_date = ?, verification_url = ?, status = 'Verified'
                WHERE application_id = ?
                """,
                (
                    document["verification_id"],
                    document["issue_date"],
                    document["verification_url"],
                    application["id"],
                ),
            )
        else:
            conn.execute(
                """
                INSERT INTO certificates
                    (application_id, certificate_id, offer_letter_id, issue_date, verification_url, status)
                VALUES (?, ?, ?, ?, ?, 'Verified')
                """,
                (
                    application["id"],
                    document["verification_id"],
                    offer_letter_id(application),
                    document["issue_date"],
                    document["verification_url"],
                ),
            )
        conn.execute(
            """
            UPDATE applications
            SET status = 'Certificate', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (application["id"],),
        )


def attendance_percentage(student_id: int) -> float:
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT COUNT(*) AS total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present
            FROM attendance
            WHERE student_id = ?
            """,
            (student_id,),
        ).fetchone()
    total = row["total"] or 0
    present = row["present"] or 0
    return round((present / total) * 100, 2) if total else 0


def assignment_completion_percentage(student_id: int, domain_id: int) -> float:
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT
                COUNT(weekly_assignments.id) AS total,
                SUM(CASE WHEN assignment_submissions.id IS NOT NULL THEN 1 ELSE 0 END) AS completed
            FROM weekly_assignments
            LEFT JOIN assignment_submissions
                ON assignment_submissions.assignment_id = weekly_assignments.id
                AND assignment_submissions.student_id = ?
            WHERE weekly_assignments.domain_id = ?
            """,
            (student_id, domain_id),
        ).fetchone()
    total = row["total"] or 0
    completed = row["completed"] or 0
    return round((completed / total) * 100, 2) if total else 0


def latest_project_submission(student_id: int, domain_id: int) -> dict[str, Any] | None:
    with get_connection() as conn:
        return row_to_dict(
            conn.execute(
                """
                SELECT project_submissions.*
                FROM project_submissions
                JOIN projects ON projects.id = project_submissions.project_id
                WHERE project_submissions.student_id = ? AND projects.domain_id = ?
                ORDER BY project_submissions.submitted_at DESC, project_submissions.id DESC
                LIMIT 1
                """,
                (student_id, domain_id),
            ).fetchone()
        )


def _document_payload(document: dict[str, Any]) -> dict[str, Any]:
    document = _with_verification_url(document)
    return {
        **document,
        "document_id": document.get("verification_id"),
        "type_label": document.get("document_type", "").replace("_", " ").title(),
    }


def _with_verification_url(document: dict[str, Any]) -> dict[str, Any]:
    if document is None:
        return document
    document = dict(document)
    document["verification_url"] = f"{VERIFICATION_PORTAL_URL}/verify/{document['verification_id']}"
    return document


def _log_document_email(application: dict[str, Any], document: dict[str, Any], email_type: str, subject: str) -> None:
    with get_connection() as conn:
        log_email_event(
            conn,
            email_type=email_type,
            recipient_email=application["student"]["email"],
            subject=subject,
            user_id=application["student_id"],
            application_id=application["id"],
            metadata={
                "document_type": document["document_type"],
                "verification_id": document["verification_id"],
                "verification_url": document["verification_url"],
            },
        )
