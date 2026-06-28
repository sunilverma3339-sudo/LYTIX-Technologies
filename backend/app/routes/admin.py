from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import require_admin
from app.database import get_connection
from app.models.constants import PAYMENT_STATUSES, STATUS_FLOW
from app.routes.common import (
    application_row,
    dump_model,
    ensure_application,
    latest_payment,
    linkedin_summary_for_application,
    public_user,
    tasks_for_application,
)
from app.routes.documents import certificate as generate_certificate_pdf
from app.schemas import (
    AdminApplicationUpdate,
    AdminDecision,
    PaymentMark,
    ProjectReview,
    TaskCreate,
    TaskUpdate,
)
from app.utils.email import log_email_event


router = APIRouter(prefix="/admin", tags=["admin"])
ADMIN_STATUSES = [*STATUS_FLOW, "Rejected"]


@router.get("/students")
def view_all_students(_: dict = Depends(require_admin)) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM users WHERE role = 'student' ORDER BY created_at DESC"
        ).fetchall()
    return [public_user(dict(row)) for row in rows]


@router.get("/applications")
def view_all_applications(_: dict = Depends(require_admin)) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute("SELECT id FROM applications ORDER BY created_at DESC").fetchall()
    return [application_row(row["id"]) for row in rows]


@router.get("/dashboard")
def admin_dashboard(_: dict = Depends(require_admin)) -> dict:
    with get_connection() as conn:
        app_rows = conn.execute("SELECT id FROM applications ORDER BY created_at DESC").fetchall()
        totals = conn.execute(
            """
            SELECT
                COUNT(DISTINCT users.id) AS students,
                COUNT(DISTINCT applications.id) AS applications,
                COALESCE(SUM(CASE WHEN payments.status = 'Paid' THEN payments.amount ELSE 0 END), 0) AS revenue,
                COUNT(DISTINCT certificates.id) AS certificates
            FROM users
            LEFT JOIN applications ON applications.student_id = users.id
            LEFT JOIN payments ON payments.application_id = applications.id
            LEFT JOIN certificates ON certificates.application_id = applications.id
            WHERE users.role = 'student'
            """
        ).fetchone()
        paid = conn.execute(
            "SELECT COUNT(DISTINCT application_id) AS count FROM payments WHERE status = 'Paid'"
        ).fetchone()
        project_metrics = conn.execute(
            """
            SELECT
                (SELECT COUNT(*) FROM projects) AS total_projects,
                (SELECT COUNT(*) FROM project_submissions) AS total_project_submissions,
                (SELECT COUNT(*) FROM project_submissions WHERE status = 'submitted') AS pending_project_reviews,
                (SELECT COUNT(*) FROM project_submissions WHERE status = 'approved') AS approved_projects,
                (SELECT COUNT(*) FROM placement_profiles WHERE COALESCE(resume_url, '') != '') AS total_resumes,
                (SELECT COALESCE(ROUND(AVG(ats_score), 2), 0) FROM placement_profiles WHERE ats_score IS NOT NULL) AS average_ats_score,
                (SELECT COUNT(*) FROM placement_profiles WHERE placement_status != 'Not Started') AS placement_pipeline_count,
                (SELECT COUNT(*) FROM job_alerts) AS total_job_alerts,
                (SELECT COUNT(*) FROM ai_recommendation_history) AS ai_recommendations,
                (SELECT COUNT(*) FROM resume_analysis_results) AS ai_resume_analyses,
                (SELECT COALESCE(ROUND(AVG(score), 2), 0) FROM interview_attempts) AS ai_interview_average_score,
                (SELECT COALESCE(ROUND(AVG(final_score), 2), 0) FROM project_review_results) AS ai_project_average_score,
                (SELECT COUNT(*) FROM code_analysis_history) AS ai_code_analyses
            """
        ).fetchone()
        domain_rows = conn.execute(
            """
            SELECT internship_domains.name AS domain, COUNT(applications.id) AS enrollments
            FROM internship_domains
            LEFT JOIN applications ON applications.domain_id = internship_domains.id
            GROUP BY internship_domains.id
            ORDER BY enrollments DESC, internship_domains.name
            """
        ).fetchall()
    applications = [application_row(row["id"]) for row in app_rows]
    linkedin_average = 0
    if applications:
        linkedin_average = round(
            sum(linkedin_summary_for_application(application)["completion_percentage"] for application in applications)
            / len(applications),
            2,
        )
    return {
        "metrics": {
            "students": totals["students"] or 0,
            "applications": totals["applications"] or 0,
            "paid": paid["count"] or 0,
            "certified": totals["certificates"] or 0,
            "revenue": totals["revenue"] or 0,
            "total_projects": project_metrics["total_projects"] or 0,
            "total_project_submissions": project_metrics["total_project_submissions"] or 0,
            "pending_project_reviews": project_metrics["pending_project_reviews"] or 0,
            "approved_projects": project_metrics["approved_projects"] or 0,
            "total_resumes": project_metrics["total_resumes"] or 0,
            "average_ats_score": project_metrics["average_ats_score"] or 0,
            "placement_pipeline_count": project_metrics["placement_pipeline_count"] or 0,
            "total_job_alerts": project_metrics["total_job_alerts"] or 0,
            "linkedin_completion_average": linkedin_average,
            "ai_recommendations": project_metrics["ai_recommendations"] or 0,
            "ai_resume_analyses": project_metrics["ai_resume_analyses"] or 0,
            "ai_interview_average_score": project_metrics["ai_interview_average_score"] or 0,
            "ai_project_average_score": project_metrics["ai_project_average_score"] or 0,
            "ai_code_analyses": project_metrics["ai_code_analyses"] or 0,
        },
        "domain_enrollments": [dict(row) for row in domain_rows],
        "workflow": ADMIN_STATUSES,
        "payment_statuses": PAYMENT_STATUSES,
        "applications": applications,
    }


@router.patch("/applications/{application_id}")
def update_application_admin(
    application_id: int,
    payload: AdminApplicationUpdate,
    _: dict = Depends(require_admin),
) -> dict:
    ensure_application(application_id)
    updates = dump_model(payload)
    payment_status = updates.pop("payment_status", None)
    if "status" in updates and updates["status"] not in ADMIN_STATUSES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid status")
    if payment_status and payment_status not in PAYMENT_STATUSES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid payment status")

    with get_connection() as conn:
        if updates:
            assignments = ", ".join([f"{key} = ?" for key in updates])
            conn.execute(
                f"""
                UPDATE applications
                SET {assignments}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (*updates.values(), application_id),
            )
        if payment_status:
            _upsert_payment(conn, application_id, payment_status)
    return application_row(application_id)


@router.patch("/applications/{application_id}/decision")
def approve_or_reject_application(
    application_id: int,
    payload: AdminDecision,
    _: dict = Depends(require_admin),
) -> dict:
    ensure_application(application_id)
    next_status = "Selected" if payload.decision == "Approved" else "Rejected"
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE applications
            SET decision = ?, status = ?, test_score = COALESCE(?, test_score),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (payload.decision, next_status, payload.test_score, application_id),
        )
        recipient = _application_recipient(conn, application_id)
        log_email_event(
            conn,
            email_type="selection_notification" if payload.decision == "Approved" else "rejection_notification",
            recipient_email=recipient["email"],
            subject=f"LYTIX internship application {payload.decision.lower()}",
            user_id=recipient["student_id"],
            application_id=application_id,
            metadata={"decision": payload.decision, "status": next_status},
        )
    return application_row(application_id)


@router.patch("/applications/{application_id}/payment")
def mark_payment_completed(
    application_id: int,
    payload: PaymentMark,
    _: dict = Depends(require_admin),
) -> dict:
    ensure_application(application_id)
    with get_connection() as conn:
        _upsert_payment(conn, application_id, payload.status)
        if payload.status == "Paid":
            conn.execute(
                """
                UPDATE applications
                SET status = 'Offer Letter', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (application_id,),
            )
            recipient = _application_recipient(conn, application_id)
            log_email_event(
                conn,
                email_type="payment_confirmation",
                recipient_email=recipient["email"],
                subject="LYTIX payment confirmation",
                user_id=recipient["student_id"],
                application_id=application_id,
                metadata={"payment_status": payload.status},
            )
            log_email_event(
                conn,
                email_type="internship_activation",
                recipient_email=recipient["email"],
                subject="Your LYTIX internship is active",
                user_id=recipient["student_id"],
                application_id=application_id,
                metadata={"payment_status": payload.status},
            )
            log_email_event(
                conn,
                email_type="new_payment_alert",
                recipient_email="admin@lytix.tech",
                subject="New LYTIX payment received",
                user_id=recipient["student_id"],
                application_id=application_id,
                metadata={"payment_status": payload.status},
            )
    return application_row(application_id)


@router.post("/applications/{application_id}/tasks", status_code=status.HTTP_201_CREATED)
def assign_task(
    application_id: int,
    payload: TaskCreate,
    admin: dict = Depends(require_admin),
) -> dict:
    application = ensure_application(application_id)
    sort_order = len(tasks_for_application(application_id)) + 1
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO tasks
                (application_id, domain_id, title, description, due_date, assigned_by, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                application_id,
                application["domain"]["id"],
                payload.title,
                payload.description or "",
                payload.due_date,
                admin["id"],
                sort_order,
            ),
        )
        conn.execute(
            """
            UPDATE applications
            SET status = 'Tasks', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (application_id,),
        )
        task = conn.execute("SELECT * FROM tasks WHERE id = ?", (cursor.lastrowid,)).fetchone()
        recipient = _application_recipient(conn, application_id)
        log_email_event(
            conn,
            email_type="assignment_notification",
            recipient_email=recipient["email"],
            subject=f"New LYTIX assignment: {payload.title}",
            user_id=recipient["student_id"],
            application_id=application_id,
            metadata={"task_id": cursor.lastrowid, "title": payload.title},
        )
    return dict(task)


@router.patch("/tasks/{task_id}")
def update_task(task_id: int, payload: TaskUpdate, _: dict = Depends(require_admin)) -> dict:
    updates = dump_model(payload)
    if not updates:
        with get_connection() as conn:
            task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
            if task is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
            return dict(task)
    assignments = ", ".join([f"{key} = ?" for key in updates])
    with get_connection() as conn:
        cursor = conn.execute(
            f"""
            UPDATE tasks
            SET {assignments}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (*updates.values(), task_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return dict(task)


@router.patch("/applications/{application_id}/project-review")
def review_project_submission(
    application_id: int,
    payload: ProjectReview,
    _: dict = Depends(require_admin),
) -> dict:
    ensure_application(application_id)
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE applications
            SET project_status = ?, status = CASE
                    WHEN ? = 'Reviewed' THEN 'LinkedIn Update'
                    ELSE status
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (payload.project_status, payload.project_status, application_id),
        )
    return application_row(application_id)


@router.post("/applications/{application_id}/certificate")
def generate_certificate(application_id: int, admin: dict = Depends(require_admin)):
    return generate_certificate_pdf(application_id, admin)


def _application_recipient(conn, application_id: int) -> dict:
    row = conn.execute(
        """
        SELECT users.id AS student_id, users.email, users.name
        FROM applications
        JOIN users ON users.id = applications.student_id
        WHERE applications.id = ?
        """,
        (application_id,),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application recipient not found")
    return dict(row)


def _upsert_payment(conn, application_id: int, payment_status: str) -> None:
    payment = latest_payment(application_id)
    if payment:
        conn.execute(
            """
            UPDATE payments
            SET status = ?, paid_at = CASE WHEN ? = 'Paid' THEN CURRENT_TIMESTAMP ELSE paid_at END
            WHERE id = ?
            """,
            (payment_status, payment_status, payment["id"]),
        )
    else:
        application = application_row(application_id)
        conn.execute(
            """
            INSERT INTO payments (application_id, amount, status, paid_at)
            VALUES (?, ?, ?, CASE WHEN ? = 'Paid' THEN CURRENT_TIMESTAMP ELSE NULL END)
            """,
            (application_id, application["domain"]["fee"], payment_status, payment_status),
        )
