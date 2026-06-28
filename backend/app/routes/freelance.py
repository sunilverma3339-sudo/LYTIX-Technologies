from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import require_admin
from app.database import get_connection
from app.schemas import FreelanceProjectCreate


router = APIRouter(tags=["freelance"])


@router.post("/freelance/projects", status_code=status.HTTP_201_CREATED)
def create_freelance_project(payload: FreelanceProjectCreate) -> dict:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO freelance_projects
                (title, category, description, budget, duration, skills,
                 experience_level, deadline, client_name, client_email, company_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.title,
                payload.category,
                payload.description,
                payload.budget,
                payload.duration,
                payload.skills,
                payload.experience_level,
                payload.deadline,
                payload.client_name,
                payload.client_email,
                payload.company_name or "",
            ),
        )
        row = conn.execute(
            "SELECT * FROM freelance_projects WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
    return _project_response(dict(row))


@router.get("/freelance/projects")
def approved_freelance_projects() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT * FROM freelance_projects
            WHERE status = 'Approved'
            ORDER BY created_at DESC
            """
        ).fetchall()
    return [_project_response(dict(row)) for row in rows]


@router.get("/admin/freelance/projects")
def admin_freelance_projects(_: dict = Depends(require_admin)) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT * FROM freelance_projects
            ORDER BY
                CASE status
                    WHEN 'Pending Approval' THEN 1
                    WHEN 'Approved' THEN 2
                    WHEN 'Rejected' THEN 3
                    ELSE 4
                END,
                created_at DESC
            """
        ).fetchall()
    return [_project_response(dict(row)) for row in rows]


@router.put("/admin/freelance/projects/{project_id}/approve")
def approve_freelance_project(project_id: int, _: dict = Depends(require_admin)) -> dict:
    return _set_project_status(project_id, "Approved")


@router.put("/admin/freelance/projects/{project_id}/reject")
def reject_freelance_project(project_id: int, _: dict = Depends(require_admin)) -> dict:
    return _set_project_status(project_id, "Rejected")


@router.delete("/admin/freelance/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_freelance_project(project_id: int, _: dict = Depends(require_admin)) -> None:
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM freelance_projects WHERE id = ?", (project_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Freelance project not found")


def _set_project_status(project_id: int, next_status: str) -> dict:
    with get_connection() as conn:
        cursor = conn.execute(
            "UPDATE freelance_projects SET status = ? WHERE id = ?",
            (next_status, project_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Freelance project not found")
        row = conn.execute("SELECT * FROM freelance_projects WHERE id = ?", (project_id,)).fetchone()
    return _project_response(dict(row))


def _project_response(project: dict) -> dict:
    skills = [
        skill.strip()
        for skill in (project.get("skills") or "").split(",")
        if skill.strip()
    ]
    return {**project, "skills_list": skills}
