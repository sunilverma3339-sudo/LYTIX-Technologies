from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user, require_admin, require_student
from app.database import get_connection, row_to_dict
from app.schemas import ProjectCreate, ProjectReviewRequest, ProjectSubmissionCreate
from app.utils.email import log_email_event


router = APIRouter(prefix="/projects", tags=["projects"])


def _student_application(user_id: int) -> dict:
    with get_connection() as conn:
        row = row_to_dict(
            conn.execute(
                "SELECT * FROM applications WHERE student_id = ? ORDER BY created_at DESC LIMIT 1",
                (user_id,),
            ).fetchone()
        )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return row


@router.post("", status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, _: dict = Depends(require_admin)) -> dict:
    with get_connection() as conn:
        domain = conn.execute(
            "SELECT id FROM internship_domains WHERE id = ?", (payload.domain_id,)
        ).fetchone()
        if domain is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found")
        cursor = conn.execute(
            """
            INSERT INTO projects
                (title, description, domain_id, difficulty, deadline, requirements, max_marks)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.title,
                payload.description or "",
                payload.domain_id,
                payload.difficulty,
                payload.deadline,
                payload.requirements or "",
                payload.max_marks,
            ),
        )
        project = conn.execute("SELECT * FROM projects WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(project)


@router.get("/domain/{domain_id}")
def get_projects_by_domain(domain_id: int, user: dict = Depends(get_current_user)) -> list[dict]:
    student_id = user["id"] if user["role"] == "student" else None
    return _projects_for_domain(domain_id, student_id)


@router.get("/me")
def get_my_projects(user: dict = Depends(require_student)) -> list[dict]:
    application = _student_application(user["id"])
    return _projects_for_domain(application["domain_id"], user["id"])


@router.post("/submit", status_code=status.HTTP_201_CREATED)
def submit_project(payload: ProjectSubmissionCreate, user: dict = Depends(require_student)) -> dict:
    application = _student_application(user["id"])
    with get_connection() as conn:
        project = conn.execute(
            "SELECT * FROM projects WHERE id = ? AND domain_id = ?",
            (payload.project_id, application["domain_id"]),
        ).fetchone()
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        conn.execute(
            """
            INSERT INTO project_submissions
                (project_id, student_id, github_link, documentation_link, ppt_link, demo_video_link, status)
            VALUES (?, ?, ?, ?, ?, ?, 'submitted')
            ON CONFLICT(project_id, student_id)
            DO UPDATE SET github_link = excluded.github_link,
                documentation_link = excluded.documentation_link,
                ppt_link = excluded.ppt_link,
                demo_video_link = excluded.demo_video_link,
                submitted_at = CURRENT_TIMESTAMP,
                status = 'submitted',
                marks = NULL,
                feedback = NULL,
                reviewed_at = NULL
            """,
            (
                payload.project_id,
                user["id"],
                payload.github_link,
                payload.documentation_link or "",
                payload.ppt_link or "",
                payload.demo_video_link or "",
            ),
        )
        conn.execute(
            """
            UPDATE applications
            SET final_project_url = ?, project_status = 'Submitted',
                status = 'Final Project', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (payload.github_link, application["id"]),
        )
        submission = conn.execute(
            """
            SELECT * FROM project_submissions
            WHERE project_id = ? AND student_id = ?
            """,
            (payload.project_id, user["id"]),
        ).fetchone()
        log_email_event(
            conn,
            email_type="project_submission_confirmation",
            recipient_email=user["email"],
            subject="LYTIX project submission received",
            user_id=user["id"],
            application_id=application["id"],
            metadata={"project_id": payload.project_id, "github_link": payload.github_link},
        )
    return dict(submission)


@router.patch("/submissions/{submission_id}/review")
def review_project_submission(
    submission_id: int,
    payload: ProjectReviewRequest,
    _: dict = Depends(require_admin),
) -> dict:
    with get_connection() as conn:
        submission = row_to_dict(
            conn.execute("SELECT * FROM project_submissions WHERE id = ?", (submission_id,)).fetchone()
        )
        if submission is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project submission not found")
        cursor = conn.execute(
            """
            UPDATE project_submissions
            SET status = ?, marks = ?, feedback = ?, reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (payload.status, payload.marks, payload.feedback or "", submission_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project submission not found")
        conn.execute(
            """
            UPDATE applications
            SET project_status = ?, status = CASE WHEN ? = 'approved' THEN 'LinkedIn Update' ELSE status END,
                updated_at = CURRENT_TIMESTAMP
            WHERE student_id = ?
            """,
            (payload.status, payload.status, submission["student_id"]),
        )
        updated = conn.execute(
            "SELECT * FROM project_submissions WHERE id = ?", (submission_id,)
        ).fetchone()
    return dict(updated)


@router.get("/status/me")
def get_student_project_status(user: dict = Depends(require_student)) -> dict:
    application = _student_application(user["id"])
    projects = _projects_for_domain(application["domain_id"], user["id"])
    latest_submission = next((project for project in projects if project.get("submission_id")), None)
    return {
        "application_id": application["id"],
        "domain_id": application["domain_id"],
        "project_status": latest_submission.get("submission_status") if latest_submission else "not submitted",
        "marks": latest_submission.get("marks") if latest_submission else None,
        "feedback": latest_submission.get("feedback") if latest_submission else "",
        "deadline": latest_submission.get("deadline") if latest_submission else projects[0]["deadline"] if projects else None,
        "projects": projects,
    }


@router.get("/submissions")
def get_all_project_submissions(_: dict = Depends(require_admin)) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                project_submissions.*,
                projects.title AS project_title,
                projects.domain_id,
                projects.deadline,
                projects.max_marks,
                users.name AS student_name,
                users.email AS student_email,
                internship_domains.name AS domain_name
            FROM project_submissions
            JOIN projects ON projects.id = project_submissions.project_id
            JOIN users ON users.id = project_submissions.student_id
            JOIN internship_domains ON internship_domains.id = projects.domain_id
            ORDER BY project_submissions.submitted_at DESC
            """
        ).fetchall()
    return [dict(row) for row in rows]


def _projects_for_domain(domain_id: int, student_id: int | None) -> list[dict]:
    with get_connection() as conn:
        if student_id:
            rows = conn.execute(
                """
                SELECT
                    projects.*,
                    project_submissions.id AS submission_id,
                    project_submissions.github_link,
                    project_submissions.documentation_link,
                    project_submissions.ppt_link,
                    project_submissions.demo_video_link,
                    project_submissions.submitted_at,
                    project_submissions.status AS submission_status,
                    project_submissions.marks,
                    project_submissions.feedback,
                    project_submissions.reviewed_at
                FROM projects
                LEFT JOIN project_submissions
                    ON project_submissions.project_id = projects.id
                    AND project_submissions.student_id = ?
                WHERE projects.domain_id = ?
                ORDER BY projects.deadline, projects.id
                """,
                (student_id, domain_id),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM projects WHERE domain_id = ? ORDER BY deadline, id",
                (domain_id,),
            ).fetchall()
    return [dict(row) for row in rows]
