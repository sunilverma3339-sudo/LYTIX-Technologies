import os

from fastapi import APIRouter, HTTPException, Response, status

from app.database import get_connection, row_to_dict
from app.routes.documents import get_document_by_verification
from app.utils.pdf_generator import build_qr_svg


router = APIRouter(tags=["verification"])
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")


@router.get("/verify/{verification_id}")
def verify_certificate(verification_id: str) -> dict:
    try:
        document = get_document_by_verification(verification_id)
        return {
            "valid": document["status"] == "Issued",
            "certificate": {
                "document_number": document["verification_id"],
                "verification_code": document["verification_id"],
                "certificate_id": document["verification_id"],
                "document_type": document["document_type"],
                "issued_at": document["issue_date"],
                "issue_date": document["issue_date"],
                "status": "Verified" if document["status"] == "Issued" else document["status"],
                "student_name": document["student_name"],
                "student_email": document["student_email"],
                "college": document["college"],
                "domain": document["domain_name"],
                "duration_weeks": document["duration_weeks"],
                "internship_id": document["internship_id"],
                "start_date": document["start_date"],
                "end_date": document["end_date"],
                "verification_url": document["verification_url"],
            },
        }
    except HTTPException:
        legacy = _legacy_certificate(verification_id)
        if legacy is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        return legacy


@router.get("/certificates/{verification_id}/qr.svg")
def certificate_qr(verification_id: str) -> Response:
    return Response(
        build_qr_svg(f"{FRONTEND_URL}/verify/{verification_id}"),
        media_type="image/svg+xml",
    )


def _legacy_certificate(certificate_id: str) -> dict | None:
    with get_connection() as conn:
        row = row_to_dict(
            conn.execute(
                """
                SELECT
                    certificates.certificate_id,
                    certificates.issue_date,
                    certificates.status,
                    certificates.verification_url,
                    users.name AS student_name,
                    users.email AS student_email,
                    users.college,
                    internship_domains.name AS domain_name,
                    internship_domains.duration_weeks,
                    applications.internship_id,
                    applications.start_date,
                    applications.end_date,
                    applications.final_project_url
                FROM certificates
                JOIN applications ON applications.id = certificates.application_id
                JOIN users ON users.id = applications.student_id
                JOIN internship_domains ON internship_domains.id = applications.domain_id
                WHERE certificates.certificate_id = ?
                """,
                (certificate_id,),
            ).fetchone()
        )
    if row is None:
        return None
    return {
        "valid": row["status"] == "Verified",
        "certificate": {
            "document_number": row["certificate_id"],
            "verification_code": row["certificate_id"],
            "certificate_id": row["certificate_id"],
            "document_type": "certificate",
            "issued_at": row["issue_date"],
            "issue_date": row["issue_date"],
            "status": row["status"],
            "student_name": row["student_name"],
            "student_email": row["student_email"],
            "college": row["college"],
            "domain": row["domain_name"],
            "duration_weeks": row["duration_weeks"],
            "internship_id": row["internship_id"],
            "start_date": row["start_date"],
            "end_date": row["end_date"],
            "final_project_url": row["final_project_url"],
        },
    }
