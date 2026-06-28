import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth.dependencies import (
    get_current_user,
    require_admin,
    require_admin_or_mentor,
    require_hr,
    require_recruiter,
    require_super_admin,
    require_student,
)
from app.database import get_connection, row_to_dict
from app.models.constants import STATUS_FLOW
from app.routes.common import application_row, dump_model, public_user
from app.schemas import (
    CandidatePipelineUpdate,
    CommunityCommentCreate,
    CommunityPostCreate,
    EmailLogCreate,
    HackathonCreate,
    HackathonSubmit,
    RecruiterContactRequest,
    RecruiterShortlistRequest,
    RoleManagementRequest,
    TeamCreate,
    TeamMemberAdd,
    TeamUpdate,
)
from app.utils.email import log_email_event


router = APIRouter(tags=["enterprise"])


@router.get("/hr/dashboard")
def hr_dashboard(_: dict = Depends(require_hr)) -> dict:
    applications = _candidate_rows()
    pipeline = {}
    for item in applications:
        status_name = item["candidate_status"] or item["application_status"]
        pipeline[status_name] = pipeline.get(status_name, 0) + 1
    return {
        "metrics": {
            "applications": len(applications),
            "shortlisted": sum(1 for item in applications if item["shortlisted"]),
            "interviews": sum(1 for item in applications if item.get("interview_date")),
            "placed": sum(1 for item in applications if item.get("placement_status") == "Placed"),
        },
        "pipeline": pipeline,
        "applications": applications,
    }


@router.get("/hr/applications")
def hr_applications(_: dict = Depends(require_hr)) -> list[dict]:
    return _candidate_rows()


@router.patch("/hr/applications/{application_id}")
def update_hr_candidate(
    application_id: int,
    payload: CandidatePipelineUpdate,
    user: dict = Depends(require_hr),
) -> dict:
    application = application_row(application_id)
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    updates = dump_model(payload)
    if not updates:
        return _candidate_row(application_id)
    if "shortlisted" in updates:
        updates["shortlisted"] = 1 if updates["shortlisted"] else 0
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO candidate_pipeline (application_id, updated_by)
            VALUES (?, ?)
            ON CONFLICT(application_id) DO NOTHING
            """,
            (application_id, user["id"]),
        )
        assignments = ", ".join([f"{key} = ?" for key in updates])
        conn.execute(
            f"""
            UPDATE candidate_pipeline
            SET {assignments}, updated_by = ?, updated_at = CURRENT_TIMESTAMP
            WHERE application_id = ?
            """,
            (*updates.values(), user["id"], application_id),
        )
    return _candidate_row(application_id)


@router.get("/recruiter/search")
def recruiter_search(
    domain_id: int | None = Query(default=None),
    skills: str | None = Query(default=None),
    ats_min: int | None = Query(default=None, ge=0, le=100),
    project_score_min: int | None = Query(default=None, ge=0, le=100),
    placement_status: str | None = Query(default=None),
    _: dict = Depends(require_recruiter),
) -> list[dict]:
    profiles = _talent_profiles()
    if domain_id:
        profiles = [profile for profile in profiles if profile["domain_id"] == domain_id]
    if skills:
        needle = skills.lower()
        profiles = [
            profile for profile in profiles
            if needle in " ".join(profile["skills"]).lower()
        ]
    if ats_min is not None:
        profiles = [profile for profile in profiles if profile["ats_score"] >= ats_min]
    if project_score_min is not None:
        profiles = [profile for profile in profiles if profile["project_score"] >= project_score_min]
    if placement_status:
        profiles = [
            profile for profile in profiles
            if profile["placement_status"].lower() == placement_status.lower()
        ]
    return profiles


@router.post("/recruiter/shortlists", status_code=status.HTTP_201_CREATED)
def recruiter_shortlist(
    payload: RecruiterShortlistRequest,
    user: dict = Depends(require_recruiter),
) -> dict:
    _ensure_student(payload.student_id)
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO recruiter_shortlists (recruiter_id, student_id, notes)
            VALUES (?, ?, ?)
            ON CONFLICT(recruiter_id, student_id)
            DO UPDATE SET notes = excluded.notes, status = 'Shortlisted', updated_at = CURRENT_TIMESTAMP
            """,
            (user["id"], payload.student_id, payload.notes or ""),
        )
        student = conn.execute("SELECT email FROM users WHERE id = ?", (payload.student_id,)).fetchone()
        if student:
            log_email_event(
                conn,
                email_type="candidate_shortlisting",
                recipient_email=student["email"],
                subject="You have been shortlisted by a LYTIX recruiter",
                user_id=payload.student_id,
                metadata={"recruiter_id": user["id"], "notes": payload.notes or ""},
            )
    return {"message": "Student shortlisted.", "student_id": payload.student_id}


@router.get("/recruiter/shortlists")
def recruiter_shortlists(user: dict = Depends(require_recruiter)) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT recruiter_shortlists.*, users.name AS student_name, users.email AS student_email
            FROM recruiter_shortlists
            JOIN users ON users.id = recruiter_shortlists.student_id
            WHERE recruiter_shortlists.recruiter_id = ?
            ORDER BY recruiter_shortlists.updated_at DESC
            """,
            (user["id"],),
        ).fetchall()
    return [dict(row) for row in rows]


@router.post("/recruiter/contact-request")
def recruiter_contact_request(
    payload: RecruiterContactRequest,
    user: dict = Depends(require_recruiter),
) -> dict:
    _ensure_student(payload.student_id)
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO recruiter_shortlists
                (recruiter_id, student_id, status, notes, contact_requested)
            VALUES (?, ?, 'Contact Requested', ?, 1)
            ON CONFLICT(recruiter_id, student_id)
            DO UPDATE SET status = 'Contact Requested',
                notes = excluded.notes,
                contact_requested = 1,
                updated_at = CURRENT_TIMESTAMP
            """,
            (user["id"], payload.student_id, payload.notes or ""),
        )
        student = conn.execute("SELECT email FROM users WHERE id = ?", (payload.student_id,)).fetchone()
        if student:
            log_email_event(
                conn,
                email_type="interview_request",
                recipient_email=student["email"],
                subject="LYTIX recruiter contact request",
                user_id=payload.student_id,
                metadata={"recruiter_id": user["id"], "notes": payload.notes or ""},
            )
    return {"message": "Contact request logged.", "student_id": payload.student_id}


@router.get("/teams")
def list_teams(_: dict = Depends(require_admin_or_mentor)) -> list[dict]:
    return _team_rows()


@router.post("/teams", status_code=status.HTTP_201_CREATED)
def create_team(payload: TeamCreate, user: dict = Depends(require_admin_or_mentor)) -> dict:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO teams (name, domain_id, mentor_id, lead_student_id, created_by)
            VALUES (?, ?, ?, ?, ?)
            """,
            (payload.name, payload.domain_id, payload.mentor_id, payload.lead_student_id, user["id"]),
        )
    return _team_row(cursor.lastrowid)


@router.patch("/teams/{team_id}")
def update_team(team_id: int, payload: TeamUpdate, _: dict = Depends(require_admin_or_mentor)) -> dict:
    updates = dump_model(payload)
    if not updates:
        return _team_row(team_id)
    assignments = ", ".join([f"{key} = ?" for key in updates])
    with get_connection() as conn:
        cursor = conn.execute(
            f"UPDATE teams SET {assignments} WHERE id = ?",
            (*updates.values(), team_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return _team_row(team_id)


@router.post("/teams/{team_id}/members", status_code=status.HTTP_201_CREATED)
def add_team_member(
    team_id: int,
    payload: TeamMemberAdd,
    _: dict = Depends(require_admin_or_mentor),
) -> dict:
    _ensure_student(payload.student_id)
    with get_connection() as conn:
        team = conn.execute("SELECT id FROM teams WHERE id = ?", (team_id,)).fetchone()
        if team is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        conn.execute(
            "INSERT OR IGNORE INTO team_members (team_id, student_id) VALUES (?, ?)",
            (team_id, payload.student_id),
        )
    return _team_row(team_id)


@router.get("/teams/{team_id}/progress")
def team_progress(team_id: int, _: dict = Depends(require_admin_or_mentor)) -> dict:
    team = _team_row(team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    members = team["members"]
    progress_values = []
    for member in members:
        app = _latest_application_for_student(member["id"])
        if app and app["status"] in STATUS_FLOW:
            progress_values.append(round((STATUS_FLOW.index(app["status"]) / max(len(STATUS_FLOW) - 1, 1)) * 100, 2))
    average_progress = round(sum(progress_values) / len(progress_values), 2) if progress_values else 0
    return {"team": team, "member_count": len(members), "average_progress": average_progress}


@router.get("/community/groups")
def community_groups(user: dict = Depends(get_current_user)) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT community_groups.*, internship_domains.name AS domain_name
            FROM community_groups
            JOIN internship_domains ON internship_domains.id = community_groups.domain_id
            ORDER BY internship_domains.name
            """
        ).fetchall()
    return [dict(row) for row in rows]


@router.get("/community/posts")
def community_posts(
    domain_id: int | None = Query(default=None),
    post_type: str | None = Query(default=None),
    user: dict = Depends(get_current_user),
) -> list[dict]:
    query = """
        SELECT community_posts.*, users.name AS author_name, internship_domains.name AS domain_name
        FROM community_posts
        JOIN users ON users.id = community_posts.author_id
        LEFT JOIN internship_domains ON internship_domains.id = community_posts.domain_id
    """
    conditions = []
    params: list[Any] = []
    if domain_id:
        conditions.append("community_posts.domain_id = ?")
        params.append(domain_id)
    if post_type:
        conditions.append("community_posts.post_type = ?")
        params.append(post_type)
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY community_posts.created_at DESC, community_posts.id DESC"
    with get_connection() as conn:
        rows = conn.execute(query, tuple(params)).fetchall()
    return [dict(row) for row in rows]


@router.post("/community/posts", status_code=status.HTTP_201_CREATED)
def create_community_post(
    payload: CommunityPostCreate,
    user: dict = Depends(get_current_user),
) -> dict:
    if payload.post_type in ("announcement", "event") and user["role"] not in ("admin", "mentor", "hr", "super_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Announcement or event access required")
    group_id = payload.group_id
    domain_id = payload.domain_id
    with get_connection() as conn:
        if group_id and not domain_id:
            group = conn.execute("SELECT domain_id FROM community_groups WHERE id = ?", (group_id,)).fetchone()
            if group is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community group not found")
            domain_id = group["domain_id"]
        cursor = conn.execute(
            """
            INSERT INTO community_posts
                (group_id, domain_id, author_id, post_type, title, content, event_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                group_id,
                domain_id,
                user["id"],
                payload.post_type,
                payload.title,
                payload.content,
                payload.event_date,
            ),
        )
    return _community_post(cursor.lastrowid)


@router.get("/community/posts/{post_id}/comments")
def post_comments(post_id: int, user: dict = Depends(get_current_user)) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT community_comments.*, users.name AS author_name
            FROM community_comments
            JOIN users ON users.id = community_comments.author_id
            WHERE community_comments.post_id = ?
            ORDER BY community_comments.created_at
            """,
            (post_id,),
        ).fetchall()
    return [dict(row) for row in rows]


@router.post("/community/posts/{post_id}/comments", status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    payload: CommunityCommentCreate,
    user: dict = Depends(get_current_user),
) -> dict:
    with get_connection() as conn:
        post = conn.execute("SELECT id FROM community_posts WHERE id = ?", (post_id,)).fetchone()
        if post is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        cursor = conn.execute(
            "INSERT INTO community_comments (post_id, author_id, content) VALUES (?, ?, ?)",
            (post_id, user["id"], payload.content),
        )
        row = conn.execute("SELECT * FROM community_comments WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)


@router.get("/hackathons")
def list_hackathons() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT hackathons.*, internship_domains.name AS domain_name
            FROM hackathons
            LEFT JOIN internship_domains ON internship_domains.id = hackathons.domain_id
            ORDER BY hackathons.deadline, hackathons.id
            """
        ).fetchall()
    return [dict(row) for row in rows]


@router.post("/hackathons", status_code=status.HTTP_201_CREATED)
def create_hackathon(payload: HackathonCreate, user: dict = Depends(require_admin)) -> dict:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO hackathons (domain_id, title, description, deadline, prize, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                payload.domain_id,
                payload.title,
                payload.description or "",
                payload.deadline,
                payload.prize or "",
                user["id"],
            ),
        )
        row = conn.execute("SELECT * FROM hackathons WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)


@router.post("/hackathons/{hackathon_id}/register", status_code=status.HTTP_201_CREATED)
def register_hackathon(hackathon_id: int, user: dict = Depends(require_student)) -> dict:
    with get_connection() as conn:
        hackathon = conn.execute("SELECT id FROM hackathons WHERE id = ?", (hackathon_id,)).fetchone()
        if hackathon is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hackathon not found")
        conn.execute(
            """
            INSERT INTO hackathon_registrations (hackathon_id, student_id)
            VALUES (?, ?)
            ON CONFLICT(hackathon_id, student_id) DO NOTHING
            """,
            (hackathon_id, user["id"]),
        )
    return {"message": "Hackathon registration saved.", "hackathon_id": hackathon_id}


@router.post("/hackathons/{hackathon_id}/submit")
def submit_hackathon_project(
    hackathon_id: int,
    payload: HackathonSubmit,
    user: dict = Depends(require_student),
) -> dict:
    score = min(100, 60 + (20 if "github" in payload.project_link.lower() else 10) + len(payload.project_link) % 20)
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO hackathon_registrations
                (hackathon_id, student_id, project_link, score, status, submitted_at)
            VALUES (?, ?, ?, ?, 'Submitted', CURRENT_TIMESTAMP)
            ON CONFLICT(hackathon_id, student_id)
            DO UPDATE SET project_link = excluded.project_link,
                score = excluded.score,
                status = 'Submitted',
                submitted_at = CURRENT_TIMESTAMP
            """,
            (hackathon_id, user["id"], payload.project_link, score),
        )
    return {"message": "Hackathon project submitted.", "score": score}


@router.get("/hackathons/{hackathon_id}/leaderboard")
def hackathon_leaderboard(hackathon_id: int) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                hackathon_registrations.*,
                users.name AS student_name,
                users.email AS student_email
            FROM hackathon_registrations
            JOIN users ON users.id = hackathon_registrations.student_id
            WHERE hackathon_registrations.hackathon_id = ?
            ORDER BY hackathon_registrations.score DESC, hackathon_registrations.submitted_at DESC
            """,
            (hackathon_id,),
        ).fetchall()
    return [dict(row) for row in rows]


@router.get("/email-logs")
def email_logs(_: dict = Depends(require_admin)) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT email_logs.*, users.name AS user_name
            FROM email_logs
            LEFT JOIN users ON users.id = email_logs.user_id
            ORDER BY email_logs.created_at DESC, email_logs.id DESC
            """
        ).fetchall()
    return [dict(row) for row in rows]


@router.post("/email-logs", status_code=status.HTTP_201_CREATED)
def create_email_log(payload: EmailLogCreate, _: dict = Depends(require_admin)) -> dict:
    metadata = payload.metadata or "{}"
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO email_logs
                (user_id, application_id, email_type, recipient_email, subject, status, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.user_id,
                payload.application_id,
                payload.email_type,
                payload.recipient_email,
                payload.subject,
                payload.status or "Queued",
                metadata,
            ),
        )
        row = conn.execute("SELECT * FROM email_logs WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)


@router.get("/super-admin/analytics")
def super_admin_analytics(_: dict = Depends(require_super_admin)) -> dict:
    with get_connection() as conn:
        totals = conn.execute(
            """
            SELECT
                COUNT(*) AS total_users,
                SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) AS total_students,
                SUM(CASE WHEN role = 'mentor' THEN 1 ELSE 0 END) AS total_mentors,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS total_admins,
                SUM(CASE WHEN role = 'hr' THEN 1 ELSE 0 END) AS total_hr,
                SUM(CASE WHEN role = 'recruiter' THEN 1 ELSE 0 END) AS total_recruiters,
                SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) AS total_super_admins
            FROM users
            """
        ).fetchone()
        revenue = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM payments WHERE status = 'Paid'"
        ).fetchone()
        platform = conn.execute(
            """
            SELECT
                (SELECT COUNT(*) FROM applications) AS applications,
                (SELECT COUNT(*) FROM certificates) AS certificates,
                (SELECT COUNT(*) FROM documents) AS documents,
                (SELECT COUNT(*) FROM teams) AS teams,
                (SELECT COUNT(*) FROM community_posts) AS community_posts,
                (SELECT COUNT(*) FROM hackathons) AS hackathons,
                (SELECT COUNT(*) FROM email_logs) AS email_logs,
                (SELECT COUNT(*) FROM recruiter_shortlists) AS recruiter_shortlists
            """
        ).fetchone()
        users = conn.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
    return {
        "totals": dict(totals),
        "total_revenue": revenue["total_revenue"] or 0,
        "platform": dict(platform),
        "users": [public_user(dict(user)) for user in users],
        "role_management": "Placeholder: role changes are stored locally for MVP testing.",
    }


@router.patch("/super-admin/users/{user_id}/role")
def super_admin_update_role(
    user_id: int,
    payload: RoleManagementRequest,
    _: dict = Depends(require_super_admin),
) -> dict:
    with get_connection() as conn:
        cursor = conn.execute("UPDATE users SET role = ? WHERE id = ?", (payload.role, user_id))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return public_user(dict(row))


def _candidate_rows() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                applications.id AS application_id,
                applications.internship_id,
                applications.status AS application_status,
                applications.test_score,
                users.id AS student_id,
                users.name AS student_name,
                users.email AS student_email,
                internship_domains.name AS domain_name,
                COALESCE(candidate_pipeline.candidate_status, applications.status) AS candidate_status,
                COALESCE(candidate_pipeline.shortlisted, 0) AS shortlisted,
                candidate_pipeline.interview_date,
                candidate_pipeline.notes,
                placement_profiles.placement_status
            FROM applications
            JOIN users ON users.id = applications.student_id
            JOIN internship_domains ON internship_domains.id = applications.domain_id
            LEFT JOIN candidate_pipeline ON candidate_pipeline.application_id = applications.id
            LEFT JOIN placement_profiles ON placement_profiles.student_id = users.id
            ORDER BY applications.created_at DESC, applications.id DESC
            """
        ).fetchall()
    return [_candidate_payload(dict(row)) for row in rows]


def _candidate_row(application_id: int) -> dict:
    row = next((item for item in _candidate_rows() if item["application_id"] == application_id), None)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return row


def _candidate_payload(row: dict[str, Any]) -> dict[str, Any]:
    row["shortlisted"] = bool(row.get("shortlisted"))
    row["placement_status"] = row.get("placement_status") or "Not Started"
    return row


def _talent_profiles() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                users.id AS student_id,
                users.name AS student_name,
                users.email,
                applications.internship_id,
                applications.skills,
                applications.linkedin_url,
                internship_domains.id AS domain_id,
                internship_domains.name AS domain_name,
                internship_domains.skills AS domain_skills,
                placement_profiles.ats_score,
                placement_profiles.github_url,
                placement_profiles.placement_status,
                certificates.certificate_id,
                certificates.verification_url,
                COALESCE(
                    (SELECT final_score FROM project_review_results WHERE project_review_results.student_id = users.id ORDER BY id DESC LIMIT 1),
                    (SELECT marks FROM project_submissions WHERE project_submissions.student_id = users.id ORDER BY id DESC LIMIT 1),
                    0
                ) AS project_score
            FROM users
            JOIN applications ON applications.student_id = users.id
            JOIN internship_domains ON internship_domains.id = applications.domain_id
            LEFT JOIN placement_profiles ON placement_profiles.student_id = users.id
            LEFT JOIN certificates ON certificates.application_id = applications.id
            WHERE users.role = 'student'
            ORDER BY users.name
            """
        ).fetchall()
    profiles = []
    for row in rows:
        data = dict(row)
        skill_text = data.get("skills") or data.get("domain_skills") or ""
        skills = [
            skill.strip()
            for skill in skill_text.replace("[", "").replace("]", "").replace('"', "").split(",")
            if skill.strip()
        ]
        profiles.append(
            {
                "student_id": data["student_id"],
                "student_name": data["student_name"],
                "email": data["email"],
                "internship_id": data["internship_id"],
                "domain_id": data["domain_id"],
                "domain": data["domain_name"],
                "skills": skills,
                "ats_score": data.get("ats_score") or 0,
                "project_score": data.get("project_score") or 0,
                "placement_status": data.get("placement_status") or "Not Started",
                "certificate_verification_link": data.get("verification_url") or "",
                "certificate_id": data.get("certificate_id") or "",
                "linkedin_url": data.get("linkedin_url") or "",
                "github_url": data.get("github_url") or "",
            }
        )
    return profiles


def _team_rows() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                teams.*,
                internship_domains.name AS domain_name,
                mentor.name AS mentor_name,
                lead.name AS lead_student_name
            FROM teams
            LEFT JOIN internship_domains ON internship_domains.id = teams.domain_id
            LEFT JOIN users AS mentor ON mentor.id = teams.mentor_id
            LEFT JOIN users AS lead ON lead.id = teams.lead_student_id
            ORDER BY teams.name
            """
        ).fetchall()
    return [_team_payload(dict(row)) for row in rows]


def _team_row(team_id: int) -> dict:
    row = next((item for item in _team_rows() if item["id"] == team_id), None)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return row


def _team_payload(row: dict[str, Any]) -> dict[str, Any]:
    with get_connection() as conn:
        members = conn.execute(
            """
            SELECT users.id, users.name, users.email
            FROM team_members
            JOIN users ON users.id = team_members.student_id
            WHERE team_members.team_id = ?
            ORDER BY users.name
            """,
            (row["id"],),
        ).fetchall()
    row["members"] = [dict(member) for member in members]
    row["member_count"] = len(row["members"])
    return row


def _community_post(post_id: int) -> dict:
    with get_connection() as conn:
        row = row_to_dict(
            conn.execute(
                """
                SELECT community_posts.*, users.name AS author_name
                FROM community_posts
                JOIN users ON users.id = community_posts.author_id
                WHERE community_posts.id = ?
                """,
                (post_id,),
            ).fetchone()
        )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return row


def _ensure_student(student_id: int) -> None:
    with get_connection() as conn:
        student = conn.execute(
            "SELECT id FROM users WHERE id = ? AND role = 'student'",
            (student_id,),
        ).fetchone()
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")


def _latest_application_for_student(student_id: int) -> dict | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM applications WHERE student_id = ? ORDER BY created_at DESC, id DESC LIMIT 1",
            (student_id,),
        ).fetchone()
    return application_row(row["id"]) if row else None
