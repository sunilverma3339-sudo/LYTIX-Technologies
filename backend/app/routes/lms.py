from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user, require_admin, require_student
from app.database import get_connection, row_to_dict
from app.routes.common import dump_model
from app.schemas import (
    AssignmentCreate,
    AssignmentReview,
    AssignmentSubmit,
    AttendanceMark,
    LearningMaterialCreate,
    MaterialProgressUpdate,
    QuizAttempt,
    QuizCreate,
)


router = APIRouter(tags=["lms"])


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


@router.post("/learning/materials", status_code=status.HTTP_201_CREATED)
def create_learning_material(payload: LearningMaterialCreate, _: dict = Depends(require_admin)) -> dict:
    with get_connection() as conn:
        domain = conn.execute(
            "SELECT id FROM internship_domains WHERE id = ?", (payload.domain_id,)
        ).fetchone()
        if domain is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found")
        cursor = conn.execute(
            """
            INSERT INTO learning_materials
                (title, description, domain_id, type, url, week_number)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                payload.title,
                payload.description or "",
                payload.domain_id,
                payload.type,
                payload.url,
                payload.week_number,
            ),
        )
        material = conn.execute(
            "SELECT * FROM learning_materials WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return dict(material)


@router.get("/learning/materials/domain/{domain_id}")
def get_learning_materials_by_domain(
    domain_id: int,
    user: dict = Depends(get_current_user),
) -> list[dict]:
    student_id = user["id"] if user["role"] == "student" else None
    return _materials_for_domain(domain_id, student_id)


@router.get("/learning/materials/me")
def get_my_learning_materials(user: dict = Depends(require_student)) -> list[dict]:
    application = _student_application(user["id"])
    return _materials_for_domain(application["domain_id"], user["id"])


@router.patch("/learning/materials/{material_id}/progress")
def mark_material_progress(
    material_id: int,
    payload: MaterialProgressUpdate,
    user: dict = Depends(require_student),
) -> dict:
    application = _student_application(user["id"])
    with get_connection() as conn:
        material = conn.execute(
            "SELECT * FROM learning_materials WHERE id = ? AND domain_id = ?",
            (material_id, application["domain_id"]),
        ).fetchone()
        if material is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning material not found")
        conn.execute(
            """
            INSERT INTO material_progress (material_id, student_id, status)
            VALUES (?, ?, ?)
            ON CONFLICT(material_id, student_id)
            DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP
            """,
            (material_id, user["id"], payload.status),
        )
    return {"material_id": material_id, "status": payload.status}


@router.post("/attendance/mark", status_code=status.HTTP_201_CREATED)
def mark_attendance(payload: AttendanceMark, admin: dict = Depends(require_admin)) -> dict:
    with get_connection() as conn:
        student = conn.execute(
            "SELECT id FROM users WHERE id = ? AND role = 'student'", (payload.student_id,)
        ).fetchone()
        if student is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        conn.execute(
            """
            INSERT INTO attendance (student_id, date, status, remarks, marked_by)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(student_id, date)
            DO UPDATE SET status = excluded.status,
                remarks = excluded.remarks,
                marked_by = excluded.marked_by,
                created_at = CURRENT_TIMESTAMP
            """,
            (payload.student_id, payload.date, payload.status, payload.remarks or "", admin["id"]),
        )
        row = conn.execute(
            "SELECT * FROM attendance WHERE student_id = ? AND date = ?",
            (payload.student_id, payload.date),
        ).fetchone()
    return dict(row)


@router.get("/attendance/me")
def get_student_attendance(user: dict = Depends(require_student)) -> dict:
    return _attendance_for_student(user["id"])


@router.get("/attendance/student/{student_id}")
def get_attendance_by_student(student_id: int, _: dict = Depends(require_admin)) -> dict:
    return _attendance_for_student(student_id)


@router.post("/assignments", status_code=status.HTTP_201_CREATED)
def create_assignment(payload: AssignmentCreate, _: dict = Depends(require_admin)) -> dict:
    with get_connection() as conn:
        domain = conn.execute(
            "SELECT id FROM internship_domains WHERE id = ?", (payload.domain_id,)
        ).fetchone()
        if domain is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found")
        cursor = conn.execute(
            """
            INSERT INTO weekly_assignments
                (domain_id, title, description, week_number, due_date)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                payload.domain_id,
                payload.title,
                payload.description or "",
                payload.week_number,
                payload.due_date,
            ),
        )
        assignment = conn.execute(
            "SELECT * FROM weekly_assignments WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return dict(assignment)


@router.get("/assignments/domain/{domain_id}")
def get_assignments_by_domain(domain_id: int, user: dict = Depends(get_current_user)) -> list[dict]:
    student_id = user["id"] if user["role"] == "student" else None
    return _assignments_for_domain(domain_id, student_id)


@router.get("/assignments/me")
def get_my_assignments(user: dict = Depends(require_student)) -> list[dict]:
    application = _student_application(user["id"])
    return _assignments_for_domain(application["domain_id"], user["id"])


@router.post("/assignments/{assignment_id}/submit", status_code=status.HTTP_201_CREATED)
def submit_assignment(
    assignment_id: int,
    payload: AssignmentSubmit,
    user: dict = Depends(require_student),
) -> dict:
    application = _student_application(user["id"])
    with get_connection() as conn:
        assignment = conn.execute(
            "SELECT * FROM weekly_assignments WHERE id = ? AND domain_id = ?",
            (assignment_id, application["domain_id"]),
        ).fetchone()
        if assignment is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
        conn.execute(
            """
            INSERT INTO assignment_submissions (assignment_id, student_id, submission_link, status)
            VALUES (?, ?, ?, 'submitted')
            ON CONFLICT(assignment_id, student_id)
            DO UPDATE SET submission_link = excluded.submission_link,
                submitted_at = CURRENT_TIMESTAMP,
                status = 'submitted',
                marks = NULL,
                feedback = NULL
            """,
            (assignment_id, user["id"], payload.submission_link),
        )
        submission = conn.execute(
            """
            SELECT * FROM assignment_submissions
            WHERE assignment_id = ? AND student_id = ?
            """,
            (assignment_id, user["id"]),
        ).fetchone()
    return dict(submission)


@router.get("/admin/submissions")
def get_assignment_submissions(_: dict = Depends(require_admin)) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                assignment_submissions.*,
                weekly_assignments.title AS assignment_title,
                weekly_assignments.week_number,
                users.name AS student_name,
                internship_domains.name AS domain_name
            FROM assignment_submissions
            JOIN weekly_assignments ON weekly_assignments.id = assignment_submissions.assignment_id
            JOIN users ON users.id = assignment_submissions.student_id
            JOIN internship_domains ON internship_domains.id = weekly_assignments.domain_id
            ORDER BY assignment_submissions.submitted_at DESC
            """
        ).fetchall()
    return [dict(row) for row in rows]


@router.patch("/assignments/submissions/{submission_id}/review")
def review_assignment_submission(
    submission_id: int,
    payload: AssignmentReview,
    _: dict = Depends(require_admin),
) -> dict:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            UPDATE assignment_submissions
            SET status = ?, marks = ?, feedback = ?
            WHERE id = ?
            """,
            (payload.status, payload.marks, payload.feedback or "", submission_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
        row = conn.execute(
            "SELECT * FROM assignment_submissions WHERE id = ?", (submission_id,)
        ).fetchone()
    return dict(row)


@router.post("/quizzes", status_code=status.HTTP_201_CREATED)
def create_quiz(payload: QuizCreate, _: dict = Depends(require_admin)) -> dict:
    with get_connection() as conn:
        domain = conn.execute(
            "SELECT id FROM internship_domains WHERE id = ?", (payload.domain_id,)
        ).fetchone()
        if domain is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found")
        cursor = conn.execute(
            """
            INSERT INTO quizzes (domain_id, title, description, week_number)
            VALUES (?, ?, ?, ?)
            """,
            (payload.domain_id, payload.title, payload.description or "", payload.week_number),
        )
        quiz_id = cursor.lastrowid
        for question_order, question in enumerate(payload.questions, start=1):
            if not any(option.is_correct for option in question.options):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Each question must have a correct option",
                )
            question_cursor = conn.execute(
                """
                INSERT INTO quiz_questions (quiz_id, question_text, sort_order)
                VALUES (?, ?, ?)
                """,
                (quiz_id, question.question_text, question_order),
            )
            question_id = question_cursor.lastrowid
            for option_order, option in enumerate(question.options, start=1):
                conn.execute(
                    """
                    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order)
                    VALUES (?, ?, ?, ?)
                    """,
                    (question_id, option.option_text, 1 if option.is_correct else 0, option_order),
                )
    return _quiz_payload(quiz_id, include_answers=True)


@router.get("/quizzes/domain/{domain_id}")
def get_quizzes_by_domain(domain_id: int, user: dict = Depends(get_current_user)) -> list[dict]:
    include_answers = user["role"] == "admin"
    student_id = user["id"] if user["role"] == "student" else None
    return _quizzes_for_domain(domain_id, include_answers=include_answers, student_id=student_id)


@router.get("/quizzes/me")
def get_my_quizzes(user: dict = Depends(require_student)) -> list[dict]:
    application = _student_application(user["id"])
    return _quizzes_for_domain(application["domain_id"], include_answers=False, student_id=user["id"])


@router.post("/quizzes/{quiz_id}/attempt")
def attempt_quiz(quiz_id: int, payload: QuizAttempt, user: dict = Depends(require_student)) -> dict:
    application = _student_application(user["id"])
    with get_connection() as conn:
        quiz = conn.execute(
            "SELECT * FROM quizzes WHERE id = ? AND domain_id = ?",
            (quiz_id, application["domain_id"]),
        ).fetchone()
        if quiz is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
        correct_rows = conn.execute(
            """
            SELECT quiz_questions.id AS question_id, quiz_options.id AS option_id
            FROM quiz_questions
            JOIN quiz_options ON quiz_options.question_id = quiz_questions.id
            WHERE quiz_questions.quiz_id = ? AND quiz_options.is_correct = 1
            """,
            (quiz_id,),
        ).fetchall()
        correct = {row["question_id"]: row["option_id"] for row in correct_rows}
        answers = {answer.question_id: answer.option_id for answer in payload.answers}
        score = sum(1 for question_id, option_id in correct.items() if answers.get(question_id) == option_id)
        total = len(correct)
        conn.execute(
            """
            INSERT INTO quiz_results (quiz_id, student_id, score, total_questions)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(quiz_id, student_id)
            DO UPDATE SET score = excluded.score,
                total_questions = excluded.total_questions,
                submitted_at = CURRENT_TIMESTAMP
            """,
            (quiz_id, user["id"], score, total),
        )
    return {"quiz_id": quiz_id, "score": score, "total_questions": total}


@router.get("/quizzes/results/me")
def get_my_quiz_results(user: dict = Depends(require_student)) -> list[dict]:
    return _quiz_results_for_student(user["id"])


@router.get("/admin/quiz-results")
def get_all_quiz_results(_: dict = Depends(require_admin)) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                quiz_results.*,
                quizzes.title AS quiz_title,
                users.name AS student_name,
                internship_domains.name AS domain_name
            FROM quiz_results
            JOIN quizzes ON quizzes.id = quiz_results.quiz_id
            JOIN users ON users.id = quiz_results.student_id
            JOIN internship_domains ON internship_domains.id = quizzes.domain_id
            ORDER BY quiz_results.submitted_at DESC
            """
        ).fetchall()
    return [dict(row) for row in rows]


def _materials_for_domain(domain_id: int, student_id: int | None) -> list[dict]:
    with get_connection() as conn:
        if student_id:
            rows = conn.execute(
                """
                SELECT learning_materials.*,
                    COALESCE(material_progress.status, 'Not Started') AS progress_status
                FROM learning_materials
                LEFT JOIN material_progress
                    ON material_progress.material_id = learning_materials.id
                    AND material_progress.student_id = ?
                WHERE learning_materials.domain_id = ?
                ORDER BY learning_materials.week_number, learning_materials.id
                """,
                (student_id, domain_id),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT learning_materials.*, 'Not Started' AS progress_status
                FROM learning_materials
                WHERE domain_id = ?
                ORDER BY week_number, id
                """,
                (domain_id,),
            ).fetchall()
    return [dict(row) for row in rows]


def _attendance_for_student(student_id: int) -> dict:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC",
            (student_id,),
        ).fetchall()
    records = [dict(row) for row in rows]
    total = len(records)
    present = sum(1 for record in records if record["status"] == "present")
    percentage = round((present / total) * 100, 2) if total else 0
    return {"records": records, "total": total, "present": present, "percentage": percentage}


def _assignments_for_domain(domain_id: int, student_id: int | None) -> list[dict]:
    with get_connection() as conn:
        if student_id:
            rows = conn.execute(
                """
                SELECT weekly_assignments.*,
                    assignment_submissions.id AS submission_id,
                    assignment_submissions.submission_link,
                    assignment_submissions.submitted_at,
                    assignment_submissions.status AS submission_status,
                    assignment_submissions.marks,
                    assignment_submissions.feedback
                FROM weekly_assignments
                LEFT JOIN assignment_submissions
                    ON assignment_submissions.assignment_id = weekly_assignments.id
                    AND assignment_submissions.student_id = ?
                WHERE weekly_assignments.domain_id = ?
                ORDER BY weekly_assignments.week_number, weekly_assignments.id
                """,
                (student_id, domain_id),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT * FROM weekly_assignments
                WHERE domain_id = ?
                ORDER BY week_number, id
                """,
                (domain_id,),
            ).fetchall()
    return [dict(row) for row in rows]


def _quiz_payload(quiz_id: int, include_answers: bool, student_id: int | None = None) -> dict:
    with get_connection() as conn:
        quiz = row_to_dict(conn.execute("SELECT * FROM quizzes WHERE id = ?", (quiz_id,)).fetchone())
        if quiz is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
        questions = conn.execute(
            "SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order, id",
            (quiz_id,),
        ).fetchall()
        quiz["questions"] = []
        for question in questions:
            question_data = dict(question)
            options = conn.execute(
                "SELECT * FROM quiz_options WHERE question_id = ? ORDER BY sort_order, id",
                (question["id"],),
            ).fetchall()
            question_data["options"] = [
                dict(option) if include_answers else _public_option(dict(option))
                for option in options
            ]
            quiz["questions"].append(question_data)
        if student_id:
            quiz["result"] = row_to_dict(
                conn.execute(
                    "SELECT * FROM quiz_results WHERE quiz_id = ? AND student_id = ?",
                    (quiz_id, student_id),
                ).fetchone()
            )
    return quiz


def _public_option(option: dict) -> dict:
    option.pop("is_correct", None)
    return option


def _quizzes_for_domain(domain_id: int, include_answers: bool, student_id: int | None) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id FROM quizzes WHERE domain_id = ? ORDER BY week_number, id",
            (domain_id,),
        ).fetchall()
    return [_quiz_payload(row["id"], include_answers=include_answers, student_id=student_id) for row in rows]


def _quiz_results_for_student(student_id: int) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT quiz_results.*, quizzes.title AS quiz_title, quizzes.week_number
            FROM quiz_results
            JOIN quizzes ON quizzes.id = quiz_results.quiz_id
            WHERE quiz_results.student_id = ?
            ORDER BY quiz_results.submitted_at DESC
            """,
            (student_id,),
        ).fetchall()
    return [dict(row) for row in rows]
