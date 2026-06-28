import json
import secrets
from datetime import date, timedelta
from typing import Any

from fastapi import HTTPException, status

from app.database import get_connection, row_to_dict
from app.models.constants import DEFAULT_TASKS, STATUS_FLOW


LINKEDIN_REQUIRED_FIELDS = [
    "profile_updated",
    "headline_updated",
    "post_published",
    "tasks_documented",
    "certificate_shared",
    "internship_experience_added",
    "certificate_added",
    "project_posted",
    "company_page_followed",
]

PLACEMENT_STATUSES = [
    "Not Started",
    "Resume Reviewed",
    "Mock Interview Done",
    "Shortlisted",
    "Placed",
]


def dump_model(payload) -> dict[str, Any]:
    if hasattr(payload, "model_dump"):
        return payload.model_dump(exclude_unset=True)
    return payload.dict(exclude_unset=True)


def parse_domain(row: dict[str, Any]) -> dict[str, Any]:
    row["skills"] = json.loads(row.get("skills") or "[]")
    return row


def public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "phone": user.get("phone"),
        "college": user.get("college"),
        "graduation_year": user.get("graduation_year"),
        "role": user["role"],
        "is_email_verified": bool(int(user.get("is_email_verified") or 0)),
        "is_mobile_verified": bool(int(user.get("is_mobile_verified") or 0)),
        "created_at": user["created_at"],
    }


def latest_payment(application_id: int) -> dict[str, Any] | None:
    with get_connection() as conn:
        return row_to_dict(
            conn.execute(
                """
                SELECT *
                FROM payments
                WHERE application_id = ?
                ORDER BY created_at DESC, id DESC
                LIMIT 1
                """,
                (application_id,),
            ).fetchone()
        )


def checklist_for_application(application_id: int) -> dict[str, Any]:
    with get_connection() as conn:
        row = row_to_dict(
            conn.execute(
                "SELECT * FROM linkedin_checklist WHERE application_id = ?", (application_id,)
            ).fetchone()
        )
    if row is None:
        return {
            "application_id": application_id,
            "profile_updated": False,
            "headline_updated": False,
            "post_published": False,
            "tasks_documented": False,
            "certificate_shared": False,
            "internship_experience_added": False,
            "certificate_added": False,
            "project_posted": False,
            "company_page_followed": False,
        }
    for key in [
        "profile_updated",
        "headline_updated",
        "post_published",
        "tasks_documented",
        "certificate_shared",
        "internship_experience_added",
        "certificate_added",
        "project_posted",
        "company_page_followed",
    ]:
        row[key] = bool(row.get(key))
    return row


def linkedin_summary_for_application(application: dict[str, Any]) -> dict[str, Any]:
    checklist = checklist_for_application(application["id"])
    completed = sum(1 for field in LINKEDIN_REQUIRED_FIELDS if checklist.get(field))
    total = len(LINKEDIN_REQUIRED_FIELDS)
    has_url = bool((application.get("linkedin_url") or "").strip())
    percentage = round(((completed + (1 if has_url else 0)) / (total + 1)) * 100, 2)
    return {
        "linkedin_url": application.get("linkedin_url") or "",
        "completion_percentage": percentage,
        "completed_items": completed + (1 if has_url else 0),
        "total_items": total + 1,
        "checklist": checklist,
        "add_to_linkedin_url": linkedin_credential_url(application),
    }


def linkedin_credential_url(application: dict[str, Any]) -> str:
    certificate = application.get("certificate") or certificate_for_application(application["id"])
    credential_id = certificate["certificate_id"] if certificate else application["internship_id"]
    return (
        "https://www.linkedin.com/profile/add"
        "?startTask=CERTIFICATION_NAME"
        "&name=LYTIX%20TECHNOLOGIES%20Internship%20Certificate"
        f"&organizationName=LYTIX%20TECHNOLOGIES&certId={credential_id}"
    )


def certificate_for_application(application_id: int) -> dict[str, Any] | None:
    with get_connection() as conn:
        return row_to_dict(
            conn.execute(
                "SELECT * FROM certificates WHERE application_id = ?", (application_id,)
            ).fetchone()
        )


def documents_for_application(application_id: int) -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT *
            FROM documents
            WHERE application_id = ?
            ORDER BY issue_date DESC, id DESC
            """,
            (application_id,),
        ).fetchall()
    if rows:
        return [
            {
                "id": row["id"],
                "type": row["document_type"],
                "document_number": row["document_number"] or row["verification_id"],
                "verification_code": row["verification_id"],
                "issued_at": row["issue_date"],
                "status": row["status"],
            }
            for row in rows
        ]

    certificate = certificate_for_application(application_id)
    if not certificate:
        return []
    return [
        {
            "id": certificate["id"],
            "type": "certificate",
            "document_number": certificate["certificate_id"],
            "verification_code": certificate["certificate_id"],
            "issued_at": certificate["issue_date"],
        }
    ]


def tasks_for_application(application_id: int) -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, application_id, domain_id, title, description, due_date, status, sort_order, created_at, updated_at
            FROM tasks
            WHERE application_id = ?
            ORDER BY sort_order, id
            """,
            (application_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def ensure_default_tasks(application_id: int, domain_id: int) -> None:
    with get_connection() as conn:
        existing = conn.execute(
            "SELECT COUNT(*) AS count FROM tasks WHERE application_id = ?", (application_id,)
        ).fetchone()["count"]
        if existing:
            return
        rows = conn.execute(
            """
            SELECT title, description, sort_order
            FROM tasks
            WHERE application_id IS NULL AND domain_id = ?
            ORDER BY sort_order
            """,
            (domain_id,),
        ).fetchall()
        source = rows or [
            {"title": title, "description": description, "sort_order": index}
            for index, (title, description) in enumerate(DEFAULT_TASKS, start=1)
        ]
        for row in source:
            conn.execute(
                """
                INSERT INTO tasks (application_id, domain_id, title, description, sort_order)
                VALUES (?, ?, ?, ?, ?)
                """,
                (application_id, domain_id, row["title"], row["description"], row["sort_order"]),
            )


def application_row(application_id: int) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = row_to_dict(
            conn.execute(
                """
                SELECT
                    applications.*,
                    internship_domains.name AS domain_name,
                    internship_domains.slug AS domain_slug,
                    internship_domains.summary AS domain_summary,
                    internship_domains.duration_weeks,
                    internship_domains.fee,
                    internship_domains.skills AS domain_skills,
                    users.name AS student_name,
                    users.email AS student_email,
                    users.phone AS student_phone,
                    users.college,
                    users.graduation_year
                FROM applications
                JOIN internship_domains ON internship_domains.id = applications.domain_id
                JOIN users ON users.id = applications.student_id
                WHERE applications.id = ?
                """,
                (application_id,),
            ).fetchone()
        )
    if row is None:
        return None
    payment = latest_payment(application_id)
    certificate = certificate_for_application(application_id)
    row["domain"] = {
        "id": row.pop("domain_id"),
        "name": row.pop("domain_name"),
        "slug": row.pop("domain_slug"),
        "summary": row.pop("domain_summary"),
        "duration_weeks": row.pop("duration_weeks"),
        "fee": row.pop("fee"),
        "skills": json.loads(row.pop("domain_skills") or "[]"),
    }
    row["student"] = {
        "id": row["student_id"],
        "name": row.pop("student_name"),
        "email": row.pop("student_email"),
        "phone": row.pop("student_phone"),
        "college": row.pop("college"),
        "graduation_year": row.pop("graduation_year"),
    }
    row["payment"] = payment
    row["payment_status"] = payment["status"] if payment else "Pending"
    row["certificate"] = certificate
    row["project_submission"] = latest_project_submission(row["student_id"], row["domain"]["id"])
    return row


def ensure_application(application_id: int) -> dict[str, Any]:
    application = application_row(application_id)
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application


def ensure_application_access(application_id: int, user: dict[str, Any]) -> dict[str, Any]:
    application = ensure_application(application_id)
    if user["role"] != "admin" and application["student_id"] != user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return application


def dashboard_for_user(user: dict[str, Any]) -> dict[str, Any]:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM applications WHERE student_id = ? ORDER BY created_at DESC LIMIT 1",
            (user["id"],),
        ).fetchone()
    application = application_row(row["id"]) if row else None
    return {
        "student": public_user(user),
        "workflow": STATUS_FLOW,
        "application": application,
        "tasks": tasks_for_application(application["id"]) if application else [],
        "checklist": checklist_for_application(application["id"]) if application else None,
        "documents": documents_for_application(application["id"]) if application else [],
        "lms_summary": lms_summary_for_user(user["id"], application) if application else None,
        "project_summary": project_summary_for_user(user["id"], application) if application else None,
        "linkedin_summary": linkedin_summary_for_application(application) if application else None,
        "placement_summary": placement_summary_for_user(user["id"], application) if application else None,
        "latest_job_alerts": latest_job_alerts_for_application(application, limit=3) if application else [],
    }


def placement_summary_for_user(user_id: int, application: dict[str, Any] | None = None) -> dict[str, Any]:
    profile = placement_profile_for_user(user_id, application)
    return {
        "resume_url": profile.get("resume_url") or "",
        "github_url": profile.get("github_url") or "",
        "ats_score": profile.get("ats_score") or 0,
        "resume_feedback": profile.get("resume_feedback") or "",
        "improvement_suggestions": profile.get("improvement_suggestions") or "",
        "mock_interview_requested": bool(profile.get("mock_interview_requested")),
        "placement_status": profile.get("placement_status") or "Not Started",
    }


def placement_profile_for_user(user_id: int, application: dict[str, Any] | None = None) -> dict[str, Any]:
    with get_connection() as conn:
        profile = row_to_dict(
            conn.execute(
                "SELECT * FROM placement_profiles WHERE student_id = ?",
                (user_id,),
            ).fetchone()
        )
        if profile is None:
            application_id = application["id"] if application else None
            conn.execute(
                """
                INSERT INTO placement_profiles (student_id, application_id)
                VALUES (?, ?)
                """,
                (user_id, application_id),
            )
            profile = row_to_dict(
                conn.execute(
                    "SELECT * FROM placement_profiles WHERE student_id = ?",
                    (user_id,),
                ).fetchone()
            )
    return profile or {}


def latest_job_alerts_for_application(application: dict[str, Any], limit: int = 3) -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT job_alerts.*, internship_domains.name AS domain_name
            FROM job_alerts
            JOIN internship_domains ON internship_domains.id = job_alerts.domain_id
            WHERE job_alerts.domain_id = ?
            ORDER BY job_alerts.created_at DESC, job_alerts.id DESC
            LIMIT ?
            """,
            (application["domain"]["id"], limit),
        ).fetchall()
    return [dict(row) for row in rows]


def lms_summary_for_user(user_id: int, application: dict[str, Any]) -> dict[str, Any]:
    domain_id = application["domain"]["id"]
    with get_connection() as conn:
        material_totals = conn.execute(
            """
            SELECT
                COUNT(learning_materials.id) AS total,
                SUM(CASE WHEN material_progress.status = 'Completed' THEN 1 ELSE 0 END) AS completed
            FROM learning_materials
            LEFT JOIN material_progress
                ON material_progress.material_id = learning_materials.id
                AND material_progress.student_id = ?
            WHERE learning_materials.domain_id = ?
            """,
            (user_id, domain_id),
        ).fetchone()
        attendance = conn.execute(
            """
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present
            FROM attendance
            WHERE student_id = ?
            """,
            (user_id,),
        ).fetchone()
        assignment_totals = conn.execute(
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
            (user_id, domain_id),
        ).fetchone()
        quiz = conn.execute(
            """
            SELECT score, total_questions
            FROM quiz_results
            JOIN quizzes ON quizzes.id = quiz_results.quiz_id
            WHERE quiz_results.student_id = ? AND quizzes.domain_id = ?
            ORDER BY quiz_results.submitted_at DESC
            LIMIT 1
            """,
            (user_id, domain_id),
        ).fetchone()

    materials_total = material_totals["total"] or 0
    materials_completed = material_totals["completed"] or 0
    attendance_total = attendance["total"] or 0
    attendance_present = attendance["present"] or 0
    assignments_total = assignment_totals["total"] or 0
    assignments_completed = assignment_totals["completed"] or 0
    status_index = STATUS_FLOW.index(application["status"]) if application["status"] in STATUS_FLOW else 0
    return {
        "learning_progress": round((materials_completed / materials_total) * 100, 2) if materials_total else 0,
        "attendance_percentage": round((attendance_present / attendance_total) * 100, 2) if attendance_total else 0,
        "pending_assignments": max(assignments_total - assignments_completed, 0),
        "completed_assignments": assignments_completed,
        "quiz_score": round((quiz["score"] / quiz["total_questions"]) * 100, 2) if quiz else 0,
        "internship_progress": round((status_index / max(len(STATUS_FLOW) - 1, 1)) * 100, 2),
    }


def create_internship_id(application_id: int) -> str:
    return f"LYTIX-INT-2026-{application_id:04d}"


def application_dates(duration_weeks: int) -> tuple[str, str]:
    start = date.today()
    end = start + timedelta(weeks=duration_weeks)
    return start.isoformat(), end.isoformat()


def offer_letter_id(application: dict[str, Any]) -> str:
    return f"LYTIX-OFFER-{application['internship_id'].split('-')[-1]}"


def new_certificate_id(application_id: int) -> str:
    return f"LYTIX-CERT-{date.today().strftime('%Y%m%d')}-{application_id:04d}-{secrets.token_hex(2).upper()}"


def require_payment_completed(application: dict[str, Any]) -> None:
    if application["payment_status"] != "Paid":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Payment not completed")


def linkedin_complete(application_id: int) -> bool:
    application = application_row(application_id)
    if application is None or not (application.get("linkedin_url") or "").strip():
        return False
    checklist = checklist_for_application(application_id)
    return all(
        checklist[key]
        for key in LINKEDIN_REQUIRED_FIELDS
    )


def latest_project_submission(student_id: int, domain_id: int) -> dict[str, Any] | None:
    with get_connection() as conn:
        return row_to_dict(
            conn.execute(
                """
                SELECT
                    project_submissions.*,
                    projects.title AS project_title,
                    projects.deadline,
                    projects.max_marks,
                    projects.difficulty
                FROM project_submissions
                JOIN projects ON projects.id = project_submissions.project_id
                WHERE project_submissions.student_id = ? AND projects.domain_id = ?
                ORDER BY project_submissions.submitted_at DESC, project_submissions.id DESC
                LIMIT 1
                """,
                (student_id, domain_id),
            ).fetchone()
        )


def project_summary_for_user(user_id: int, application: dict[str, Any]) -> dict[str, Any]:
    submission = latest_project_submission(user_id, application["domain"]["id"])
    with get_connection() as conn:
        project = row_to_dict(
            conn.execute(
                """
                SELECT *
                FROM projects
                WHERE domain_id = ?
                ORDER BY deadline, id
                LIMIT 1
                """,
                (application["domain"]["id"],),
            ).fetchone()
        )
    return {
        "status": submission["status"] if submission else "not submitted",
        "marks": submission["marks"] if submission else None,
        "feedback": submission["feedback"] if submission else "",
        "deadline": submission["deadline"] if submission else project.get("deadline") if project else None,
        "project_title": submission["project_title"] if submission else project.get("title") if project else None,
    }


def tasks_completed(application_id: int) -> bool:
    tasks = tasks_for_application(application_id)
    if not tasks:
        return False
    return all(task["status"] in ("Completed", "Reviewed", "Done") for task in tasks)


def project_approved(application: dict[str, Any]) -> bool:
    submission = application.get("project_submission") or latest_project_submission(
        application["student_id"], application["domain"]["id"]
    )
    return bool(submission and submission["status"] == "approved")
