import os
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth.dependencies import get_current_user, require_admin
from app.database import get_connection, row_to_dict
from app.routes.common import (
    PLACEMENT_STATUSES,
    application_row,
    dump_model,
    ensure_application_access,
    latest_job_alerts_for_application,
    linkedin_summary_for_application,
    placement_profile_for_user,
    placement_summary_for_user,
)
from app.schemas import (
    AdminResumeReview,
    JobAlertCreate,
    LinkedInChecklistAdvancedUpdate,
    PlacementStatusUpdate,
    ResumeProfileUpdate,
)


router = APIRouter(tags=["placement"])
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")


@router.get("/linkedin/me")
def get_my_linkedin_status(user: dict = Depends(get_current_user)) -> dict:
    application = latest_application_for_student(user["id"])
    return linkedin_payload(application)


@router.patch("/linkedin/me")
def update_my_linkedin_status(
    payload: LinkedInChecklistAdvancedUpdate,
    user: dict = Depends(get_current_user),
) -> dict:
    application = latest_application_for_student(user["id"])
    return update_linkedin(application["id"], payload, user)


@router.get("/linkedin/applications/{application_id}")
def get_linkedin_status(application_id: int, user: dict = Depends(get_current_user)) -> dict:
    application = ensure_application_access(application_id, user)
    return linkedin_payload(application)


@router.patch("/linkedin/applications/{application_id}")
def update_linkedin_status(
    application_id: int,
    payload: LinkedInChecklistAdvancedUpdate,
    user: dict = Depends(get_current_user),
) -> dict:
    ensure_application_access(application_id, user)
    return update_linkedin(application_id, payload, user)


@router.get("/placement/me")
def get_my_placement_profile(user: dict = Depends(get_current_user)) -> dict:
    application = latest_application_for_student(user["id"])
    return {
        "application": application,
        "profile": placement_summary_for_user(user["id"], application),
        "statuses": PLACEMENT_STATUSES,
    }


@router.put("/placement/resume")
def update_resume_details(
    payload: ResumeProfileUpdate,
    user: dict = Depends(get_current_user),
) -> dict:
    application = latest_application_for_student(user["id"])
    ensure_placement_profile(user["id"], application["id"])
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE placement_profiles
            SET resume_url = ?, github_url = ?, updated_at = CURRENT_TIMESTAMP
            WHERE student_id = ?
            """,
            (payload.resume_url or "", payload.github_url or "", user["id"]),
        )
    return placement_summary_for_user(user["id"], application)


@router.post("/placement/mock-interview")
def request_mock_interview(user: dict = Depends(get_current_user)) -> dict:
    application = latest_application_for_student(user["id"])
    ensure_placement_profile(user["id"], application["id"])
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE placement_profiles
            SET mock_interview_requested = 1,
                mock_interview_requested_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE student_id = ?
            """,
            (user["id"],),
        )
    return {"message": "Mock interview request submitted.", "profile": placement_summary_for_user(user["id"], application)}


@router.get("/job-alerts/me")
def get_my_job_alerts(user: dict = Depends(get_current_user)) -> list[dict]:
    application = latest_application_for_student(user["id"])
    return job_alerts_for_domain(application["domain"]["id"])


@router.get("/job-alerts")
def get_job_alerts(domain_id: int | None = Query(default=None)) -> list[dict]:
    return job_alerts_for_domain(domain_id)


@router.get("/admin/placement/resumes")
def admin_resume_list(_: dict = Depends(require_admin)) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                users.id AS student_id,
                users.name AS student_name,
                users.email,
                applications.id AS application_id,
                applications.internship_id,
                applications.linkedin_url,
                internship_domains.id AS domain_id,
                internship_domains.name AS domain_name,
                placement_profiles.resume_url,
                placement_profiles.github_url,
                placement_profiles.ats_score,
                placement_profiles.resume_feedback,
                placement_profiles.improvement_suggestions,
                placement_profiles.mock_interview_requested,
                placement_profiles.placement_status,
                placement_profiles.updated_at
            FROM users
            LEFT JOIN applications ON applications.student_id = users.id
            LEFT JOIN internship_domains ON internship_domains.id = applications.domain_id
            LEFT JOIN placement_profiles ON placement_profiles.student_id = users.id
            WHERE users.role = 'student'
            ORDER BY users.created_at DESC, applications.id DESC
            """
        ).fetchall()
    return [placement_admin_payload(dict(row)) for row in rows]


@router.patch("/admin/placement/resumes/{student_id}")
def admin_review_resume(
    student_id: int,
    payload: AdminResumeReview,
    _: dict = Depends(require_admin),
) -> dict:
    application = latest_application_for_student(student_id)
    ensure_placement_profile(student_id, application["id"])
    updates = dump_model(payload)
    if "placement_status" in updates and updates["placement_status"] not in PLACEMENT_STATUSES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid placement status")
    if not updates:
        return placement_summary_for_user(student_id, application)
    assignments = ", ".join([f"{key} = ?" for key in updates])
    with get_connection() as conn:
        conn.execute(
            f"""
            UPDATE placement_profiles
            SET {assignments}, updated_at = CURRENT_TIMESTAMP
            WHERE student_id = ?
            """,
            (*updates.values(), student_id),
        )
    return placement_summary_for_user(student_id, application)


@router.patch("/admin/placement/status/{student_id}")
def admin_update_placement_status(
    student_id: int,
    payload: PlacementStatusUpdate,
    _: dict = Depends(require_admin),
) -> dict:
    application = latest_application_for_student(student_id)
    ensure_placement_profile(student_id, application["id"])
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE placement_profiles
            SET placement_status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE student_id = ?
            """,
            (payload.placement_status, student_id),
        )
    return placement_summary_for_user(student_id, application)


@router.post("/admin/job-alerts", status_code=status.HTTP_201_CREATED)
def create_job_alert(payload: JobAlertCreate, admin: dict = Depends(require_admin)) -> dict:
    with get_connection() as conn:
        domain = conn.execute(
            "SELECT id FROM internship_domains WHERE id = ?",
            (payload.domain_id,),
        ).fetchone()
        if domain is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found")
        cursor = conn.execute(
            """
            INSERT INTO job_alerts
                (domain_id, company_name, role, location, job_type, skills_required, apply_link, deadline, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.domain_id,
                payload.company_name,
                payload.role,
                payload.location or "",
                payload.job_type or "",
                payload.skills_required or "",
                payload.apply_link or "",
                payload.deadline,
                admin["id"],
            ),
        )
        row = conn.execute("SELECT * FROM job_alerts WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)


@router.get("/admin/job-alerts")
def admin_job_alerts(_: dict = Depends(require_admin)) -> list[dict]:
    return job_alerts_for_domain(None)


@router.get("/talent-directory")
def talent_directory(
    domain_id: int | None = Query(default=None),
    skills: str | None = Query(default=None),
    placement_status: str | None = Query(default=None),
) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                users.id AS student_id,
                users.name AS student_name,
                users.email,
                applications.id AS application_id,
                applications.internship_id,
                applications.skills,
                applications.linkedin_url,
                applications.final_project_url,
                internship_domains.id AS domain_id,
                internship_domains.name AS domain_name,
                internship_domains.skills AS domain_skills,
                placement_profiles.github_url,
                placement_profiles.placement_status,
                certificates.certificate_id,
                certificates.verification_url,
                project_submissions.github_link AS project_github_link,
                project_submissions.documentation_link,
                project_submissions.demo_video_link
            FROM users
            JOIN applications ON applications.student_id = users.id
            JOIN internship_domains ON internship_domains.id = applications.domain_id
            LEFT JOIN placement_profiles ON placement_profiles.student_id = users.id
            LEFT JOIN certificates ON certificates.application_id = applications.id
            LEFT JOIN project_submissions ON project_submissions.student_id = users.id
            WHERE users.role = 'student'
            ORDER BY users.name
            """
        ).fetchall()
    profiles = [talent_payload(dict(row)) for row in rows]
    if domain_id:
        profiles = [profile for profile in profiles if profile["domain_id"] == domain_id]
    if placement_status:
        profiles = [
            profile for profile in profiles
            if profile["placement_status"].lower() == placement_status.lower()
        ]
    if skills:
        needle = skills.lower()
        profiles = [
            profile for profile in profiles
            if needle in ", ".join(profile["skills"]).lower()
        ]
    return profiles


def latest_application_for_student(student_id: int) -> dict[str, Any]:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM applications WHERE student_id = ? ORDER BY created_at DESC, id DESC LIMIT 1",
            (student_id,),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application_row(row["id"])


def linkedin_payload(application: dict[str, Any]) -> dict[str, Any]:
    return {
        "application_id": application["id"],
        "internship_id": application["internship_id"],
        "domain": application["domain"],
        **linkedin_summary_for_application(application),
    }


def update_linkedin(
    application_id: int,
    payload: LinkedInChecklistAdvancedUpdate,
    user: dict,
) -> dict:
    application = ensure_application_access(application_id, user)
    updates = dump_model(payload)
    linkedin_url = updates.pop("linkedin_url", None)
    checklist_updates = updates
    with get_connection() as conn:
        if linkedin_url is not None:
            conn.execute(
                """
                UPDATE applications
                SET linkedin_url = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (linkedin_url, application_id),
            )
        if checklist_updates:
            assignments = ", ".join([f"{key} = ?" for key in checklist_updates])
            values = [1 if value else 0 for value in checklist_updates.values()]
            conn.execute(
                f"""
                UPDATE linkedin_checklist
                SET {assignments}, updated_at = CURRENT_TIMESTAMP
                WHERE application_id = ?
                """,
                (*values, application_id),
            )
    return linkedin_payload(application_row(application_id))


def ensure_placement_profile(student_id: int, application_id: int | None) -> None:
    with get_connection() as conn:
        exists = conn.execute(
            "SELECT id FROM placement_profiles WHERE student_id = ?",
            (student_id,),
        ).fetchone()
        if exists:
            conn.execute(
                """
                UPDATE placement_profiles
                SET application_id = COALESCE(application_id, ?), updated_at = CURRENT_TIMESTAMP
                WHERE student_id = ?
                """,
                (application_id, student_id),
            )
            return
        conn.execute(
            """
            INSERT INTO placement_profiles (student_id, application_id)
            VALUES (?, ?)
            """,
            (student_id, application_id),
        )


def job_alerts_for_domain(domain_id: int | None) -> list[dict]:
    query = """
        SELECT job_alerts.*, internship_domains.name AS domain_name
        FROM job_alerts
        JOIN internship_domains ON internship_domains.id = job_alerts.domain_id
    """
    params: tuple[Any, ...] = ()
    if domain_id:
        query += " WHERE job_alerts.domain_id = ?"
        params = (domain_id,)
    query += " ORDER BY job_alerts.created_at DESC, job_alerts.id DESC"
    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()
    return [dict(row) for row in rows]


def placement_admin_payload(row: dict[str, Any]) -> dict[str, Any]:
    row["mock_interview_requested"] = bool(row.get("mock_interview_requested"))
    row["ats_score"] = row.get("ats_score") or 0
    row["placement_status"] = row.get("placement_status") or "Not Started"
    return row


def talent_payload(row: dict[str, Any]) -> dict[str, Any]:
    skill_text = row.get("skills") or row.get("domain_skills") or ""
    skills = [skill.strip() for skill in skill_text.replace("[", "").replace("]", "").replace('"', "").split(",") if skill.strip()]
    certificate_id = row.get("certificate_id")
    return {
        "student_id": row["student_id"],
        "student_name": row["student_name"],
        "domain_id": row["domain_id"],
        "domain": row["domain_name"],
        "skills": skills,
        "projects": [
            value for value in [
                row.get("project_github_link"),
                row.get("final_project_url"),
                row.get("documentation_link"),
                row.get("demo_video_link"),
            ]
            if value
        ],
        "certificate_verification_link": (
            row.get("verification_url") or f"{FRONTEND_URL}/verify/{certificate_id}" if certificate_id else ""
        ),
        "linkedin_url": row.get("linkedin_url") or "",
        "github_url": row.get("github_url") or row.get("project_github_link") or "",
        "placement_status": row.get("placement_status") or "Not Started",
    }
