import json
from datetime import date, timedelta

from app.auth.jwt import hash_password
from app.models.constants import DEFAULT_TASKS, INTERNSHIP_DOMAINS

from .connection import get_connection


USER_ROLES = ("student", "mentor", "admin", "hr", "recruiter", "super_admin")


def init_db() -> None:
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                phone TEXT,
                college TEXT,
                graduation_year TEXT,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('student', 'mentor', 'admin', 'hr', 'recruiter', 'super_admin')),
                is_email_verified INTEGER NOT NULL DEFAULT 0,
                email_otp_hash TEXT,
                email_otp_expires_at TEXT,
                email_otp_attempts INTEGER NOT NULL DEFAULT 0,
                is_mobile_verified INTEGER NOT NULL DEFAULT 0,
                mobile_otp_hash TEXT,
                mobile_otp_expires_at TEXT,
                mobile_otp_attempts INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS internship_domains (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                slug TEXT NOT NULL UNIQUE,
                summary TEXT NOT NULL,
                duration_weeks INTEGER NOT NULL,
                fee INTEGER NOT NULL,
                skills TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                domain_id INTEGER NOT NULL,
                internship_id TEXT NOT NULL UNIQUE,
                status TEXT NOT NULL DEFAULT 'Applied',
                decision TEXT,
                statement TEXT NOT NULL,
                skills TEXT,
                test_score INTEGER,
                final_project_url TEXT,
                project_status TEXT NOT NULL DEFAULT 'Not Submitted',
                linkedin_url TEXT,
                start_date TEXT,
                end_date TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(student_id) REFERENCES users(id),
                FOREIGN KEY(domain_id) REFERENCES internship_domains(id)
            );

            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                application_id INTEGER NOT NULL,
                provider TEXT NOT NULL DEFAULT 'razorpay-placeholder',
                order_id TEXT,
                amount INTEGER NOT NULL,
                currency TEXT NOT NULL DEFAULT 'INR',
                status TEXT NOT NULL DEFAULT 'Pending',
                paid_at TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(application_id) REFERENCES applications(id)
            );

            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                application_id INTEGER,
                domain_id INTEGER,
                title TEXT NOT NULL,
                description TEXT,
                due_date TEXT,
                status TEXT NOT NULL DEFAULT 'Assigned',
                assigned_by INTEGER,
                sort_order INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(application_id) REFERENCES applications(id),
                FOREIGN KEY(domain_id) REFERENCES internship_domains(id),
                FOREIGN KEY(assigned_by) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS certificates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                application_id INTEGER NOT NULL UNIQUE,
                certificate_id TEXT NOT NULL UNIQUE,
                offer_letter_id TEXT,
                issue_date TEXT NOT NULL,
                verification_url TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Verified',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(application_id) REFERENCES applications(id)
            );

            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                application_id INTEGER,
                student_id INTEGER,
                document_type TEXT,
                document_number TEXT,
                verification_id TEXT,
                issue_date TEXT,
                status TEXT DEFAULT 'Issued',
                revoked_reason TEXT,
                pdf_path TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(application_id) REFERENCES applications(id),
                FOREIGN KEY(student_id) REFERENCES users(id)
            );

            CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_verification_id
            ON documents(verification_id);

            CREATE TABLE IF NOT EXISTS linkedin_checklist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                application_id INTEGER NOT NULL UNIQUE,
                profile_updated INTEGER NOT NULL DEFAULT 0,
                headline_updated INTEGER NOT NULL DEFAULT 0,
                post_published INTEGER NOT NULL DEFAULT 0,
                tasks_documented INTEGER NOT NULL DEFAULT 0,
                certificate_shared INTEGER NOT NULL DEFAULT 0,
                internship_experience_added INTEGER NOT NULL DEFAULT 0,
                certificate_added INTEGER NOT NULL DEFAULT 0,
                project_posted INTEGER NOT NULL DEFAULT 0,
                company_page_followed INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(application_id) REFERENCES applications(id)
            );

            CREATE TABLE IF NOT EXISTS placement_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL UNIQUE,
                application_id INTEGER,
                resume_url TEXT,
                github_url TEXT,
                ats_score INTEGER DEFAULT 0,
                resume_feedback TEXT,
                improvement_suggestions TEXT,
                mock_interview_requested INTEGER NOT NULL DEFAULT 0,
                mock_interview_requested_at TEXT,
                placement_status TEXT NOT NULL DEFAULT 'Not Started',
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(student_id) REFERENCES users(id),
                FOREIGN KEY(application_id) REFERENCES applications(id)
            );

            CREATE TABLE IF NOT EXISTS job_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain_id INTEGER NOT NULL,
                company_name TEXT NOT NULL,
                role TEXT NOT NULL,
                location TEXT,
                job_type TEXT,
                skills_required TEXT,
                apply_link TEXT,
                deadline TEXT,
                created_by INTEGER,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(domain_id) REFERENCES internship_domains(id),
                FOREIGN KEY(created_by) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS learning_materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                type TEXT NOT NULL CHECK(type IN ('video', 'pdf', 'article', 'link')),
                url TEXT NOT NULL,
                week_number INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(domain_id) REFERENCES internship_domains(id)
            );

            CREATE TABLE IF NOT EXISTS material_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                material_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('Not Started', 'In Progress', 'Completed')),
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(material_id, student_id),
                FOREIGN KEY(material_id) REFERENCES learning_materials(id),
                FOREIGN KEY(student_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('present', 'absent')),
                remarks TEXT,
                marked_by INTEGER,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(student_id, date),
                FOREIGN KEY(student_id) REFERENCES users(id),
                FOREIGN KEY(marked_by) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS weekly_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                week_number INTEGER NOT NULL,
                due_date TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(domain_id) REFERENCES internship_domains(id)
            );

            CREATE TABLE IF NOT EXISTS assignment_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assignment_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                submission_link TEXT NOT NULL,
                submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                status TEXT NOT NULL CHECK(status IN ('submitted', 'reviewed')) DEFAULT 'submitted',
                marks INTEGER,
                feedback TEXT,
                UNIQUE(assignment_id, student_id),
                FOREIGN KEY(assignment_id) REFERENCES weekly_assignments(id),
                FOREIGN KEY(student_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS quizzes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                week_number INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(domain_id) REFERENCES internship_domains(id)
            );

            CREATE TABLE IF NOT EXISTS quiz_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                quiz_id INTEGER NOT NULL,
                question_text TEXT NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
            );

            CREATE TABLE IF NOT EXISTS quiz_options (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_id INTEGER NOT NULL,
                option_text TEXT NOT NULL,
                is_correct INTEGER NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY(question_id) REFERENCES quiz_questions(id)
            );

            CREATE TABLE IF NOT EXISTS quiz_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                quiz_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                score INTEGER NOT NULL,
                total_questions INTEGER NOT NULL,
                submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(quiz_id, student_id),
                FOREIGN KEY(quiz_id) REFERENCES quizzes(id),
                FOREIGN KEY(student_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                difficulty TEXT NOT NULL CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
                deadline TEXT,
                requirements TEXT,
                max_marks INTEGER NOT NULL DEFAULT 100,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(domain_id) REFERENCES internship_domains(id)
            );

            CREATE TABLE IF NOT EXISTS project_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                github_link TEXT,
                documentation_link TEXT,
                ppt_link TEXT,
                demo_video_link TEXT,
                submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                status TEXT NOT NULL CHECK(status IN ('submitted', 'reviewed', 'approved', 'needs improvement')) DEFAULT 'submitted',
                marks INTEGER,
                feedback TEXT,
                reviewed_at TEXT,
                UNIQUE(project_id, student_id),
                FOREIGN KEY(project_id) REFERENCES projects(id),
                FOREIGN KEY(student_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS freelance_projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                budget TEXT NOT NULL,
                duration TEXT NOT NULL,
                skills TEXT NOT NULL,
                experience_level TEXT NOT NULL,
                deadline TEXT NOT NULL,
                client_name TEXT NOT NULL,
                client_email TEXT NOT NULL,
                company_name TEXT,
                status TEXT NOT NULL DEFAULT 'Pending Approval'
                    CHECK(status IN ('Pending Approval', 'Approved', 'Rejected')),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS ai_recommendation_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                domain_id INTEGER,
                recommended_domain TEXT NOT NULL,
                match_percentage INTEGER NOT NULL,
                reason TEXT NOT NULL,
                suggested_skills TEXT NOT NULL,
                input_profile TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(student_id) REFERENCES users(id),
                FOREIGN KEY(domain_id) REFERENCES internship_domains(id)
            );

            CREATE TABLE IF NOT EXISTS resume_analysis_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                ats_score INTEGER NOT NULL,
                missing_skills TEXT NOT NULL,
                strengths TEXT NOT NULL,
                weaknesses TEXT NOT NULL,
                improvement_suggestions TEXT NOT NULL,
                resume_url TEXT,
                source_text TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(student_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS interview_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                domain_id INTEGER,
                interview_type TEXT NOT NULL,
                questions TEXT NOT NULL,
                answers TEXT NOT NULL,
                feedback TEXT NOT NULL,
                score INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(student_id) REFERENCES users(id),
                FOREIGN KEY(domain_id) REFERENCES internship_domains(id)
            );

            CREATE TABLE IF NOT EXISTS project_review_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                project_submission_id INTEGER,
                github_link TEXT,
                documentation_link TEXT,
                demo_video_link TEXT,
                readme_quality TEXT NOT NULL,
                final_score INTEGER NOT NULL,
                suggestions TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(student_id) REFERENCES users(id),
                FOREIGN KEY(project_submission_id) REFERENCES project_submissions(id)
            );

            CREATE TABLE IF NOT EXISTS code_analysis_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                language TEXT,
                code_snippet TEXT NOT NULL,
                explanation TEXT NOT NULL,
                bug_suggestions TEXT NOT NULL,
                optimization_tips TEXT NOT NULL,
                best_practices TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(student_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS candidate_pipeline (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                application_id INTEGER NOT NULL UNIQUE,
                candidate_status TEXT NOT NULL DEFAULT 'Applied',
                shortlisted INTEGER NOT NULL DEFAULT 0,
                interview_date TEXT,
                notes TEXT,
                updated_by INTEGER,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(application_id) REFERENCES applications(id),
                FOREIGN KEY(updated_by) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS recruiter_shortlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recruiter_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'Shortlisted',
                notes TEXT,
                contact_requested INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(recruiter_id, student_id),
                FOREIGN KEY(recruiter_id) REFERENCES users(id),
                FOREIGN KEY(student_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS teams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                domain_id INTEGER,
                mentor_id INTEGER,
                lead_student_id INTEGER,
                created_by INTEGER,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(domain_id) REFERENCES internship_domains(id),
                FOREIGN KEY(mentor_id) REFERENCES users(id),
                FOREIGN KEY(lead_student_id) REFERENCES users(id),
                FOREIGN KEY(created_by) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS team_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                team_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(team_id, student_id),
                FOREIGN KEY(team_id) REFERENCES teams(id),
                FOREIGN KEY(student_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS community_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain_id INTEGER NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(domain_id) REFERENCES internship_domains(id)
            );

            CREATE TABLE IF NOT EXISTS community_posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER,
                domain_id INTEGER,
                author_id INTEGER NOT NULL,
                post_type TEXT NOT NULL DEFAULT 'discussion',
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                event_date TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(group_id) REFERENCES community_groups(id),
                FOREIGN KEY(domain_id) REFERENCES internship_domains(id),
                FOREIGN KEY(author_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS community_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id INTEGER NOT NULL,
                author_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(post_id) REFERENCES community_posts(id),
                FOREIGN KEY(author_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS hackathons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain_id INTEGER,
                title TEXT NOT NULL,
                description TEXT,
                deadline TEXT,
                prize TEXT,
                created_by INTEGER,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(domain_id) REFERENCES internship_domains(id),
                FOREIGN KEY(created_by) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS hackathon_registrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hackathon_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                project_link TEXT,
                score INTEGER DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'Registered',
                registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                submitted_at TEXT,
                UNIQUE(hackathon_id, student_id),
                FOREIGN KEY(hackathon_id) REFERENCES hackathons(id),
                FOREIGN KEY(student_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS email_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                application_id INTEGER,
                email_type TEXT NOT NULL,
                recipient_email TEXT NOT NULL,
                subject TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Queued',
                metadata TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(application_id) REFERENCES applications(id)
            );

            CREATE TABLE IF NOT EXISTS support_tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id TEXT NOT NULL UNIQUE,
                created_by INTEGER NOT NULL,
                assigned_to INTEGER,
                category TEXT NOT NULL,
                subject TEXT NOT NULL,
                description TEXT NOT NULL,
                priority TEXT NOT NULL DEFAULT 'Medium',
                status TEXT NOT NULL DEFAULT 'Open',
                attachment_url TEXT,
                resolution_notes TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(created_by) REFERENCES users(id),
                FOREIGN KEY(assigned_to) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS support_ticket_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id INTEGER NOT NULL,
                sender_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                attachment_url TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(ticket_id) REFERENCES support_tickets(id),
                FOREIGN KEY(sender_id) REFERENCES users(id)
            );
            """
        )
        _ensure_user_roles(conn)
        _ensure_user_otp_columns(conn)
        _seed_domains(conn)
        _seed_users(conn)
        _seed_applications(conn)
        _seed_lms(conn)
        _seed_projects(conn)
        _ensure_ai_tables(conn)
        _ensure_linkedin_columns(conn)
        _ensure_placement_columns(conn)
        _seed_placement(conn)
        _seed_ai(conn)
        _ensure_document_columns(conn)
        _seed_documents(conn)
        _ensure_phase8_tables(conn)
        _seed_phase8(conn)
        _seed_support(conn)


def _seed_domains(conn) -> None:
    count = conn.execute("SELECT COUNT(*) AS count FROM internship_domains").fetchone()["count"]
    if count:
        return
    for domain in INTERNSHIP_DOMAINS:
        conn.execute(
            """
            INSERT INTO internship_domains (name, slug, summary, duration_weeks, fee, skills)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                domain["name"],
                domain["slug"],
                domain["summary"],
                domain["duration_weeks"],
                domain["fee"],
                json.dumps(domain["skills"]),
            ),
        )
    for domain_id in range(1, len(INTERNSHIP_DOMAINS) + 1):
        for index, (title, description) in enumerate(DEFAULT_TASKS, start=1):
            conn.execute(
                """
                INSERT INTO tasks (domain_id, title, description, sort_order)
                VALUES (?, ?, ?, ?)
                """,
                (domain_id, title, description, index),
            )


def _ensure_user_roles(conn) -> None:
    table = conn.execute(
        "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'"
    ).fetchone()
    sql = table["sql"] if table else ""
    if all(role in sql for role in USER_ROLES):
        return
    conn.commit()
    conn.execute("PRAGMA foreign_keys = OFF")
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                phone TEXT,
                college TEXT,
                graduation_year TEXT,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('student', 'mentor', 'admin', 'hr', 'recruiter', 'super_admin')),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            INSERT INTO users_new
                (id, name, email, phone, college, graduation_year, password_hash, role, created_at)
            SELECT id, name, email, phone, college, graduation_year, password_hash, role, created_at
            FROM users;

            DROP TABLE users;
            ALTER TABLE users_new RENAME TO users;
            """
        )
        conn.commit()
    finally:
        conn.execute("PRAGMA foreign_keys = ON")


def _ensure_user_otp_columns(conn) -> None:
    existing = {
        row["name"]
        for row in conn.execute("PRAGMA table_info(users)").fetchall()
    }
    columns = {
        "is_email_verified": "INTEGER NOT NULL DEFAULT 0",
        "email_otp_hash": "TEXT",
        "email_otp_expires_at": "TEXT",
        "email_otp_attempts": "INTEGER NOT NULL DEFAULT 0",
        "is_mobile_verified": "INTEGER NOT NULL DEFAULT 0",
        "mobile_otp_hash": "TEXT",
        "mobile_otp_expires_at": "TEXT",
        "mobile_otp_attempts": "INTEGER NOT NULL DEFAULT 0",
    }
    for name, definition in columns.items():
        if name not in existing:
            conn.execute(f"ALTER TABLE users ADD COLUMN {name} {definition}")


def _seed_users(conn) -> None:
    users = [
        (
            "LYTIX Admin",
            "admin@lytix.tech",
            "+91 90000 00000",
            "LYTIX Operations",
            "2026",
            "password123",
            "admin",
        ),
        (
            "Aarav Sharma",
            "student@lytix.tech",
            "+91 98765 43210",
            "National Institute of Technology",
            "2027",
            "Student@123",
            "student",
        ),
        (
            "Nisha Patel",
            "nisha@lytix.tech",
            "+91 98765 43211",
            "Institute of Engineering and Design",
            "2026",
            "Student@123",
            "student",
        ),
        (
            "Karan Mehta",
            "karan@lytix.tech",
            "+91 98765 43212",
            "City College of Technology",
            "2028",
            "Student@123",
            "student",
        ),
        (
            "Meera HR",
            "hr@lytix.tech",
            "+91 90000 00001",
            "LYTIX Human Resources",
            "2026",
            "password123",
            "hr",
        ),
        (
            "Rohan Recruiter",
            "recruiter@lytix.tech",
            "+91 90000 00002",
            "LYTIX Talent Network",
            "2026",
            "password123",
            "recruiter",
        ),
        (
            "Sana Mentor",
            "mentor@lytix.tech",
            "+91 90000 00003",
            "LYTIX Mentorship",
            "2026",
            "password123",
            "mentor",
        ),
        (
            "LYTIX Super Admin",
            "superadmin@lytix.tech",
            "+91 90000 00004",
            "LYTIX Platform",
            "2026",
            "password123",
            "super_admin",
        ),
    ]
    for name, email, phone, college, year, password, role in users:
        exists = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if exists:
            conn.execute(
                """
                UPDATE users
                SET name = ?, phone = ?, college = ?, graduation_year = ?,
                    password_hash = ?, role = ?,
                    is_email_verified = 1,
                    email_otp_hash = NULL,
                    email_otp_expires_at = NULL,
                    email_otp_attempts = 0,
                    is_mobile_verified = 1,
                    mobile_otp_hash = NULL,
                    mobile_otp_expires_at = NULL,
                    mobile_otp_attempts = 0
                WHERE email = ?
                """,
                (name, phone, college, year, hash_password(password), role, email),
            )
            continue
        conn.execute(
            """
            INSERT INTO users
                (name, email, phone, college, graduation_year, password_hash, role,
                 is_email_verified, is_mobile_verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
            """,
            (name, email, phone, college, year, hash_password(password), role),
        )


def _seed_applications(conn) -> None:
    sample_emails = ["student@lytix.tech", "nisha@lytix.tech", "karan@lytix.tech"]
    statuses = ["LinkedIn Update", "Tasks", "Payment"]
    payment_statuses = ["Paid", "Paid", "Pending"]
    domain_ids = [1, 4, 7]
    today = date.today()

    for index, email in enumerate(sample_emails, start=1):
        user = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if not user:
            continue
        exists = conn.execute(
            "SELECT id FROM applications WHERE student_id = ?", (user["id"],)
        ).fetchone()
        if exists:
            continue

        domain = conn.execute(
            "SELECT fee, duration_weeks FROM internship_domains WHERE id = ?",
            (domain_ids[index - 1],),
        ).fetchone()
        start = today - timedelta(days=7 * index)
        end = start + timedelta(weeks=domain["duration_weeks"])
        internship_id = f"LYTIX-INT-2026-{index:04d}"
        cursor = conn.execute(
            """
            INSERT INTO applications
                (student_id, domain_id, internship_id, status, decision, statement, skills,
                 test_score, final_project_url, project_status, linkedin_url, start_date, end_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                domain_ids[index - 1],
                internship_id,
                statuses[index - 1],
                "Approved" if index < 3 else None,
                "I want structured mentorship and a portfolio-ready internship project.",
                "Python, React, Git, SQL" if index == 1 else "Data, Cloud, Git",
                86 if index == 1 else 78 if index == 2 else None,
                "https://github.com/lytix/sample-final-project" if index == 1 else "",
                "Reviewed" if index == 1 else "Not Submitted",
                "https://www.linkedin.com/in/sample-student" if index == 1 else "",
                start.isoformat(),
                end.isoformat(),
            ),
        )
        application_id = cursor.lastrowid
        _create_application_tasks(conn, application_id, domain_ids[index - 1])
        conn.execute(
            """
            INSERT INTO payments (application_id, order_id, amount, status, paid_at)
            VALUES (?, ?, ?, ?, CASE WHEN ? = 'Paid' THEN CURRENT_TIMESTAMP ELSE NULL END)
            """,
            (
                application_id,
                f"order_seed_{index:04d}",
                domain["fee"],
                payment_statuses[index - 1],
                payment_statuses[index - 1],
            ),
        )
        conn.execute(
            """
            INSERT INTO linkedin_checklist
                (application_id, profile_updated, headline_updated, post_published, tasks_documented,
                 certificate_shared, internship_experience_added, certificate_added, project_posted, company_page_followed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                application_id,
                1 if index == 1 else 0,
                1 if index == 1 else 0,
                1 if index == 1 else 0,
                1 if index == 1 else 0,
                0,
                1 if index == 1 else 0,
                1 if index == 1 else 0,
                1 if index == 1 else 0,
                1 if index == 1 else 0,
            ),
        )

        if index == 1:
            conn.execute(
                """
                INSERT INTO certificates
                    (application_id, certificate_id, offer_letter_id, issue_date, verification_url, status)
                VALUES (?, ?, ?, DATE('now'), ?, 'Verified')
                """,
                (
                    application_id,
                    "LYTIX-SAMPLE-VERIFY",
                    "LYTIX-OFFER-SAMPLE-001",
                    "http://localhost:5173/verify/LYTIX-SAMPLE-VERIFY",
                ),
            )


def _create_application_tasks(conn, application_id: int, domain_id: int) -> None:
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
    for row in rows:
        conn.execute(
            """
            INSERT INTO tasks (application_id, domain_id, title, description, sort_order)
            VALUES (?, ?, ?, ?, ?)
            """,
            (application_id, domain_id, row["title"], row["description"], row["sort_order"]),
        )


def _seed_lms(conn) -> None:
    material_count = conn.execute(
        "SELECT COUNT(*) AS count FROM learning_materials"
    ).fetchone()["count"]
    if not material_count:
        material_types = ["video", "pdf", "article", "link"]
        for domain in conn.execute("SELECT id, name FROM internship_domains ORDER BY id").fetchall():
            for week in range(1, 5):
                for index, material_type in enumerate(material_types, start=1):
                    conn.execute(
                        """
                        INSERT INTO learning_materials
                            (domain_id, title, description, type, url, week_number)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (
                            domain["id"],
                            f"Week {week} {domain['name']} {material_type.title()}",
                            f"Core {material_type} material for week {week} of {domain['name']}.",
                            material_type,
                            f"https://learn.lytix.local/{domain['id']}/week-{week}/{material_type}",
                            week,
                        ),
                    )

    assignment_count = conn.execute(
        "SELECT COUNT(*) AS count FROM weekly_assignments"
    ).fetchone()["count"]
    if not assignment_count:
        for domain in conn.execute("SELECT id, name FROM internship_domains ORDER BY id").fetchall():
            for week in range(1, 5):
                conn.execute(
                    """
                    INSERT INTO weekly_assignments (domain_id, title, description, week_number, due_date)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        domain["id"],
                        f"Week {week} Assignment - {domain['name']}",
                        f"Submit a week {week} practical task for {domain['name']}.",
                        week,
                        (date.today() + timedelta(days=7 * week)).isoformat(),
                    ),
                )

    quiz_count = conn.execute("SELECT COUNT(*) AS count FROM quizzes").fetchone()["count"]
    if not quiz_count:
        for domain in conn.execute("SELECT id, name FROM internship_domains ORDER BY id").fetchall():
            cursor = conn.execute(
                """
                INSERT INTO quizzes (domain_id, title, description, week_number)
                VALUES (?, ?, ?, 1)
                """,
                (
                    domain["id"],
                    f"{domain['name']} Fundamentals Quiz",
                    f"Baseline MCQ quiz for {domain['name']}.",
                ),
            )
            quiz_id = cursor.lastrowid
            _seed_question(
                conn,
                quiz_id,
                1,
                "What is the main goal of an internship project?",
                ["Memorize theory", "Build demonstrable skills", "Skip reviews", "Avoid documentation"],
                1,
            )
            _seed_question(
                conn,
                quiz_id,
                2,
                "Which artifact is best for final project submission?",
                ["Repository or demo link", "Blank file", "Unrelated post", "Password screenshot"],
                0,
            )

    _seed_lms_student_activity(conn)


def _seed_question(conn, quiz_id: int, order: int, question: str, options: list[str], correct_index: int) -> None:
    cursor = conn.execute(
        """
        INSERT INTO quiz_questions (quiz_id, question_text, sort_order)
        VALUES (?, ?, ?)
        """,
        (quiz_id, question, order),
    )
    question_id = cursor.lastrowid
    for option_order, option in enumerate(options, start=1):
        conn.execute(
            """
            INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order)
            VALUES (?, ?, ?, ?)
            """,
            (question_id, option, 1 if option_order - 1 == correct_index else 0, option_order),
        )


def _seed_lms_student_activity(conn) -> None:
    students = conn.execute("SELECT id FROM users WHERE role = 'student' ORDER BY id").fetchall()
    first_student = conn.execute(
        "SELECT student_id FROM applications ORDER BY id LIMIT 1"
    ).fetchone()
    for student in students:
        for days_ago in range(8):
            day = (date.today() - timedelta(days=days_ago)).isoformat()
            exists = conn.execute(
                "SELECT id FROM attendance WHERE student_id = ? AND date = ?",
                (student["id"], day),
            ).fetchone()
            if exists:
                continue
            conn.execute(
                """
                INSERT INTO attendance (student_id, date, status, remarks)
                VALUES (?, ?, ?, ?)
                """,
                (
                    student["id"],
                    day,
                    "present" if first_student and student["id"] == first_student["student_id"] else "present" if days_ago % 4 else "absent",
                    "Seed attendance record",
                ),
            )
    if first_student:
        conn.execute(
            "UPDATE attendance SET status = 'present' WHERE student_id = ?",
            (first_student["student_id"],),
        )

    first_app = conn.execute(
        "SELECT student_id, domain_id FROM applications ORDER BY id LIMIT 1"
    ).fetchone()
    if not first_app:
        return
    first_materials = conn.execute(
        """
        SELECT id FROM learning_materials
        WHERE domain_id = ?
        ORDER BY week_number, id
        LIMIT 5
        """,
        (first_app["domain_id"],),
    ).fetchall()
    for index, material in enumerate(first_materials):
        conn.execute(
            """
            INSERT OR IGNORE INTO material_progress (material_id, student_id, status)
            VALUES (?, ?, ?)
            """,
            (
                material["id"],
                first_app["student_id"],
                "Completed" if index < 3 else "In Progress",
            ),
        )

    assignment = conn.execute(
        """
        SELECT id FROM weekly_assignments
        WHERE domain_id = ?
        ORDER BY week_number, id
        LIMIT 1
        """,
        (first_app["domain_id"],),
    ).fetchone()
    if assignment:
        conn.execute(
            """
            INSERT OR IGNORE INTO assignment_submissions
                (assignment_id, student_id, submission_link, status, marks, feedback)
            VALUES (?, ?, ?, 'reviewed', 88, 'Strong practical submission.')
            """,
            (
                assignment["id"],
                first_app["student_id"],
                "https://github.com/lytix/sample-weekly-assignment",
            ),
        )
    assignments = conn.execute(
        """
        SELECT id FROM weekly_assignments
        WHERE domain_id = ?
        ORDER BY week_number, id
        """,
        (first_app["domain_id"],),
    ).fetchall()
    for index, row in enumerate(assignments, start=1):
        conn.execute(
            """
            INSERT OR IGNORE INTO assignment_submissions
                (assignment_id, student_id, submission_link, status, marks, feedback)
            VALUES (?, ?, ?, 'reviewed', ?, ?)
            """,
            (
                row["id"],
                first_app["student_id"],
                f"https://github.com/lytix/sample-week-{index}-assignment",
                85 + index,
                "Seed reviewed assignment.",
            ),
        )

    quiz = conn.execute(
        """
        SELECT id FROM quizzes
        WHERE domain_id = ?
        ORDER BY id
        LIMIT 1
        """,
        (first_app["domain_id"],),
    ).fetchone()
    if quiz:
        conn.execute(
            """
            INSERT OR IGNORE INTO quiz_results (quiz_id, student_id, score, total_questions)
            VALUES (?, ?, 2, 2)
            """,
            (quiz["id"], first_app["student_id"]),
        )


def _seed_projects(conn) -> None:
    project_count = conn.execute("SELECT COUNT(*) AS count FROM projects").fetchone()["count"]
    if not project_count:
        difficulties = ["beginner", "intermediate", "advanced"]
        for index, domain in enumerate(
            conn.execute("SELECT id, name FROM internship_domains ORDER BY id").fetchall(),
            start=1,
        ):
            conn.execute(
                """
                INSERT INTO projects
                    (domain_id, title, description, difficulty, deadline, requirements, max_marks)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    domain["id"],
                    f"{domain['name']} Capstone Project",
                    f"Build a portfolio-ready capstone project for {domain['name']}.",
                    difficulties[(index - 1) % len(difficulties)],
                    (date.today() + timedelta(days=28)).isoformat(),
                    "GitHub repository, documentation, PPT summary, and demo video are required.",
                    100,
                ),
            )

    first_app = conn.execute(
        "SELECT id, student_id, domain_id FROM applications ORDER BY id LIMIT 1"
    ).fetchone()
    if not first_app:
        return
    project = conn.execute(
        "SELECT id FROM projects WHERE domain_id = ? ORDER BY id LIMIT 1",
        (first_app["domain_id"],),
    ).fetchone()
    if not project:
        return
    conn.execute(
        """
        INSERT OR IGNORE INTO project_submissions
            (project_id, student_id, github_link, documentation_link, ppt_link, demo_video_link, status, marks, feedback, reviewed_at)
        VALUES (?, ?, ?, ?, ?, ?, 'approved', 92, 'Approved sample capstone project.', CURRENT_TIMESTAMP)
        """,
        (
            project["id"],
            first_app["student_id"],
            "https://github.com/lytix/sample-capstone",
            "https://docs.lytix.local/sample-capstone",
            "https://slides.lytix.local/sample-capstone",
            "https://video.lytix.local/sample-capstone",
        ),
    )
    conn.execute(
        """
        UPDATE tasks
        SET status = 'Completed', updated_at = CURRENT_TIMESTAMP
        WHERE application_id = ?
        """,
        (first_app["id"],),
    )


def _ensure_linkedin_columns(conn) -> None:
    existing = {
        row["name"]
        for row in conn.execute("PRAGMA table_info(linkedin_checklist)").fetchall()
    }
    columns = {
        "internship_experience_added": "INTEGER NOT NULL DEFAULT 0",
        "certificate_added": "INTEGER NOT NULL DEFAULT 0",
        "project_posted": "INTEGER NOT NULL DEFAULT 0",
        "company_page_followed": "INTEGER NOT NULL DEFAULT 0",
    }
    for name, definition in columns.items():
        if name not in existing:
            conn.execute(f"ALTER TABLE linkedin_checklist ADD COLUMN {name} {definition}")


def _ensure_placement_columns(conn) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS placement_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL UNIQUE,
            application_id INTEGER,
            resume_url TEXT,
            github_url TEXT,
            ats_score INTEGER DEFAULT 0,
            resume_feedback TEXT,
            improvement_suggestions TEXT,
            mock_interview_requested INTEGER NOT NULL DEFAULT 0,
            mock_interview_requested_at TEXT,
            placement_status TEXT NOT NULL DEFAULT 'Not Started',
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(student_id) REFERENCES users(id),
            FOREIGN KEY(application_id) REFERENCES applications(id)
        );

        CREATE TABLE IF NOT EXISTS job_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            domain_id INTEGER NOT NULL,
            company_name TEXT NOT NULL,
            role TEXT NOT NULL,
            location TEXT,
            job_type TEXT,
            skills_required TEXT,
            apply_link TEXT,
            deadline TEXT,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(domain_id) REFERENCES internship_domains(id),
            FOREIGN KEY(created_by) REFERENCES users(id)
        );
        """
    )
    existing = {
        row["name"]
        for row in conn.execute("PRAGMA table_info(placement_profiles)").fetchall()
    }
    columns = {
        "application_id": "INTEGER",
        "resume_url": "TEXT",
        "github_url": "TEXT",
        "ats_score": "INTEGER DEFAULT 0",
        "resume_feedback": "TEXT",
        "improvement_suggestions": "TEXT",
        "mock_interview_requested": "INTEGER NOT NULL DEFAULT 0",
        "mock_interview_requested_at": "TEXT",
        "placement_status": "TEXT NOT NULL DEFAULT 'Not Started'",
        "updated_at": "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
        "created_at": "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
    }
    for name, definition in columns.items():
        if name not in existing:
            conn.execute(f"ALTER TABLE placement_profiles ADD COLUMN {name} {definition}")


def _seed_placement(conn) -> None:
    applications = conn.execute(
        """
        SELECT applications.id AS application_id, applications.student_id, applications.domain_id, users.email
        FROM applications
        JOIN users ON users.id = applications.student_id
        ORDER BY applications.id
        """
    ).fetchall()
    for index, application in enumerate(applications, start=1):
        exists = conn.execute(
            "SELECT id FROM placement_profiles WHERE student_id = ?",
            (application["student_id"],),
        ).fetchone()
        if not exists:
            status = ["Resume Reviewed", "Mock Interview Done", "Not Started"][min(index - 1, 2)]
            conn.execute(
                """
                INSERT INTO placement_profiles
                    (student_id, application_id, resume_url, github_url, ats_score, resume_feedback,
                     improvement_suggestions, mock_interview_requested, placement_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    application["student_id"],
                    application["application_id"],
                    f"https://docs.lytix.local/resumes/student-{application['student_id']}.pdf",
                    "https://github.com/lytix/sample-capstone" if index == 1 else "",
                    86 if index == 1 else 72 if index == 2 else 0,
                    "Strong project-first resume. Add quantified impact and deployment links." if index == 1 else "",
                    "Add measurable outcomes, sharper skills section, and project metrics." if index == 1 else "",
                    1 if index <= 2 else 0,
                    status,
                ),
            )
        if index == 1:
            conn.execute(
                """
                UPDATE linkedin_checklist
                SET internship_experience_added = 1,
                    certificate_added = 1,
                    project_posted = 1,
                    company_page_followed = 1,
                    certificate_shared = 1
                WHERE application_id = ?
                """,
                (application["application_id"],),
            )

    job_count = conn.execute("SELECT COUNT(*) AS count FROM job_alerts").fetchone()["count"]
    if job_count:
        return
    admin = conn.execute("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").fetchone()
    companies = ["NovaCloud Labs", "DataVista AI", "SecureMesh Systems", "PixelForge Studio"]
    job_types = ["Internship", "Full-time", "Remote", "Contract"]
    for index, domain in enumerate(
        conn.execute("SELECT id, name, skills FROM internship_domains ORDER BY id").fetchall(),
        start=1,
    ):
        skills = ", ".join(json.loads(domain["skills"] or "[]")[:4])
        conn.execute(
            """
            INSERT INTO job_alerts
                (domain_id, company_name, role, location, job_type, skills_required, apply_link, deadline, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                domain["id"],
                companies[(index - 1) % len(companies)],
                f"Junior {domain['name']} Associate",
                "Hybrid - Bengaluru",
                job_types[(index - 1) % len(job_types)],
                skills,
                f"https://careers.lytix.local/jobs/{domain['id']}",
                (date.today() + timedelta(days=14 + index)).isoformat(),
                admin["id"] if admin else None,
            ),
        )


def _ensure_ai_tables(conn) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS ai_recommendation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            domain_id INTEGER,
            recommended_domain TEXT NOT NULL,
            match_percentage INTEGER NOT NULL,
            reason TEXT NOT NULL,
            suggested_skills TEXT NOT NULL,
            input_profile TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(student_id) REFERENCES users(id),
            FOREIGN KEY(domain_id) REFERENCES internship_domains(id)
        );

        CREATE TABLE IF NOT EXISTS resume_analysis_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            ats_score INTEGER NOT NULL,
            missing_skills TEXT NOT NULL,
            strengths TEXT NOT NULL,
            weaknesses TEXT NOT NULL,
            improvement_suggestions TEXT NOT NULL,
            resume_url TEXT,
            source_text TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(student_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS interview_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            domain_id INTEGER,
            interview_type TEXT NOT NULL,
            questions TEXT NOT NULL,
            answers TEXT NOT NULL,
            feedback TEXT NOT NULL,
            score INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(student_id) REFERENCES users(id),
            FOREIGN KEY(domain_id) REFERENCES internship_domains(id)
        );

        CREATE TABLE IF NOT EXISTS project_review_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            project_submission_id INTEGER,
            github_link TEXT,
            documentation_link TEXT,
            demo_video_link TEXT,
            readme_quality TEXT NOT NULL,
            final_score INTEGER NOT NULL,
            suggestions TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(student_id) REFERENCES users(id),
            FOREIGN KEY(project_submission_id) REFERENCES project_submissions(id)
        );

        CREATE TABLE IF NOT EXISTS code_analysis_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            language TEXT,
            code_snippet TEXT NOT NULL,
            explanation TEXT NOT NULL,
            bug_suggestions TEXT NOT NULL,
            optimization_tips TEXT NOT NULL,
            best_practices TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(student_id) REFERENCES users(id)
        );
        """
    )


def _seed_ai(conn) -> None:
    count = conn.execute(
        "SELECT COUNT(*) AS count FROM ai_recommendation_history"
    ).fetchone()["count"]
    if count:
        return
    sample = conn.execute(
        """
        SELECT
            applications.student_id,
            applications.domain_id,
            internship_domains.name AS domain_name,
            internship_domains.skills
        FROM applications
        JOIN internship_domains ON internship_domains.id = applications.domain_id
        ORDER BY applications.id
        LIMIT 1
        """
    ).fetchone()
    if not sample:
        return
    domain_skills = json.loads(sample["skills"] or "[]")
    conn.execute(
        """
        INSERT INTO ai_recommendation_history
            (student_id, domain_id, recommended_domain, match_percentage, reason, suggested_skills, input_profile)
        VALUES (?, ?, ?, 92, ?, ?, ?)
        """,
        (
            sample["student_id"],
            sample["domain_id"],
            sample["domain_name"],
            f"Seed profile already matches core {sample['domain_name']} skills.",
            json.dumps(domain_skills[:3]),
            json.dumps({"skills": domain_skills, "branch": "Computer Science", "interests": sample["domain_name"]}),
        ),
    )
    conn.execute(
        """
        INSERT INTO resume_analysis_results
            (student_id, ats_score, missing_skills, strengths, weaknesses, improvement_suggestions, resume_url, source_text)
        VALUES (?, 86, ?, ?, ?, ?, ?, ?)
        """,
        (
            sample["student_id"],
            json.dumps(["Deployment metrics", "Testing evidence"]),
            json.dumps(["Strong project links", "Relevant technical keywords"]),
            json.dumps(["Impact metrics are light"]),
            json.dumps(["Add quantified outcomes", "Mention testing and deployment stack"]),
            "https://docs.lytix.local/resumes/student-2.pdf",
            "Python FastAPI SQLite React Git project internship resume",
        ),
    )
    conn.execute(
        """
        INSERT INTO interview_attempts
            (student_id, domain_id, interview_type, questions, answers, feedback, score)
        VALUES (?, ?, 'Technical Interview', ?, ?, ?, 82)
        """,
        (
            sample["student_id"],
            sample["domain_id"],
            json.dumps(["Explain a recent project.", "How do you debug production issues?"]),
            json.dumps(["Built an API project.", "Use logs, tests, and isolated reproduction."]),
            "Clear fundamentals with room to add deeper architecture examples.",
        ),
    )
    submission = conn.execute(
        """
        SELECT id, github_link, documentation_link, demo_video_link
        FROM project_submissions
        WHERE student_id = ?
        ORDER BY id
        LIMIT 1
        """,
        (sample["student_id"],),
    ).fetchone()
    if submission:
        conn.execute(
            """
            INSERT INTO project_review_results
                (student_id, project_submission_id, github_link, documentation_link, demo_video_link,
                 readme_quality, final_score, suggestions)
            VALUES (?, ?, ?, ?, ?, 'Good', 88, ?)
            """,
            (
                sample["student_id"],
                submission["id"],
                submission["github_link"],
                submission["documentation_link"],
                submission["demo_video_link"],
                json.dumps(["Add screenshots", "Include setup commands and test results"]),
            ),
        )
    conn.execute(
        """
        INSERT INTO code_analysis_history
            (student_id, language, code_snippet, explanation, bug_suggestions, optimization_tips, best_practices)
        VALUES (?, 'python', ?, ?, ?, ?, ?)
        """,
        (
            sample["student_id"],
            "def add(a, b): return a + b",
            "This function returns the sum of two inputs.",
            json.dumps(["Add type hints if the input contract is known"]),
            json.dumps(["No optimization needed for this small function"]),
            json.dumps(["Add a short unit test", "Keep function names action-oriented"]),
        ),
    )


def _ensure_phase8_tables(conn) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS candidate_pipeline (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            application_id INTEGER NOT NULL UNIQUE,
            candidate_status TEXT NOT NULL DEFAULT 'Applied',
            shortlisted INTEGER NOT NULL DEFAULT 0,
            interview_date TEXT,
            notes TEXT,
            updated_by INTEGER,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(application_id) REFERENCES applications(id),
            FOREIGN KEY(updated_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS recruiter_shortlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recruiter_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'Shortlisted',
            notes TEXT,
            contact_requested INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(recruiter_id, student_id),
            FOREIGN KEY(recruiter_id) REFERENCES users(id),
            FOREIGN KEY(student_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            domain_id INTEGER,
            mentor_id INTEGER,
            lead_student_id INTEGER,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(domain_id) REFERENCES internship_domains(id),
            FOREIGN KEY(mentor_id) REFERENCES users(id),
            FOREIGN KEY(lead_student_id) REFERENCES users(id),
            FOREIGN KEY(created_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(team_id, student_id),
            FOREIGN KEY(team_id) REFERENCES teams(id),
            FOREIGN KEY(student_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS community_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            domain_id INTEGER NOT NULL UNIQUE,
            name TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(domain_id) REFERENCES internship_domains(id)
        );

        CREATE TABLE IF NOT EXISTS community_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER,
            domain_id INTEGER,
            author_id INTEGER NOT NULL,
            post_type TEXT NOT NULL DEFAULT 'discussion',
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            event_date TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(group_id) REFERENCES community_groups(id),
            FOREIGN KEY(domain_id) REFERENCES internship_domains(id),
            FOREIGN KEY(author_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS community_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            author_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(post_id) REFERENCES community_posts(id),
            FOREIGN KEY(author_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS hackathons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            domain_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            deadline TEXT,
            prize TEXT,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(domain_id) REFERENCES internship_domains(id),
            FOREIGN KEY(created_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS hackathon_registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hackathon_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            project_link TEXT,
            score INTEGER DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'Registered',
            registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            submitted_at TEXT,
            UNIQUE(hackathon_id, student_id),
            FOREIGN KEY(hackathon_id) REFERENCES hackathons(id),
            FOREIGN KEY(student_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS email_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            application_id INTEGER,
            email_type TEXT NOT NULL,
            recipient_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Queued',
            metadata TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(application_id) REFERENCES applications(id)
        );
        """
    )


def _seed_phase8(conn) -> None:
    hr = conn.execute("SELECT id FROM users WHERE role = 'hr' ORDER BY id LIMIT 1").fetchone()
    recruiter = conn.execute(
        "SELECT id FROM users WHERE role = 'recruiter' ORDER BY id LIMIT 1"
    ).fetchone()
    mentor = conn.execute("SELECT id FROM users WHERE role = 'mentor' ORDER BY id LIMIT 1").fetchone()
    admin = conn.execute("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").fetchone()
    applications = conn.execute(
        """
        SELECT id, student_id, status
        FROM applications
        ORDER BY id
        """
    ).fetchall()
    for index, application in enumerate(applications, start=1):
        conn.execute(
            """
            INSERT OR IGNORE INTO candidate_pipeline
                (application_id, candidate_status, shortlisted, interview_date, notes, updated_by)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                application["id"],
                "Interview Scheduled" if index == 1 else "Shortlisted" if index == 2 else application["status"],
                1 if index <= 2 else 0,
                (date.today() + timedelta(days=2)).isoformat() if index == 1 else None,
                "Seed HR pipeline record",
                hr["id"] if hr else None,
            ),
        )

    if recruiter and applications:
        conn.execute(
            """
            INSERT OR IGNORE INTO recruiter_shortlists
                (recruiter_id, student_id, status, notes, contact_requested)
            VALUES (?, ?, 'Shortlisted', 'Strong portfolio and verified certificate.', 1)
            """,
            (recruiter["id"], applications[0]["student_id"]),
        )

    team_names = ["Team Alpha", "Team Beta", "Team Gamma", "Team Delta"]
    students = conn.execute("SELECT id FROM users WHERE role = 'student' ORDER BY id").fetchall()
    for index, name in enumerate(team_names, start=1):
        domain_id = ((index - 1) % len(INTERNSHIP_DOMAINS)) + 1
        conn.execute(
            """
            INSERT OR IGNORE INTO teams (name, domain_id, mentor_id, lead_student_id, created_by)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                name,
                domain_id,
                mentor["id"] if mentor else None,
                students[(index - 1) % len(students)]["id"] if students else None,
                admin["id"] if admin else None,
            ),
        )
    teams = conn.execute("SELECT id FROM teams ORDER BY id").fetchall()
    for index, student in enumerate(students):
        if not teams:
            break
        team = teams[index % len(teams)]
        conn.execute(
            "INSERT OR IGNORE INTO team_members (team_id, student_id) VALUES (?, ?)",
            (team["id"], student["id"]),
        )

    for domain in conn.execute("SELECT id, name FROM internship_domains ORDER BY id").fetchall():
        conn.execute(
            """
            INSERT OR IGNORE INTO community_groups (domain_id, name, description)
            VALUES (?, ?, ?)
            """,
            (
                domain["id"],
                f"{domain['name']} Community",
                f"Domain-wise discussions, events, announcements, and peer help for {domain['name']}.",
            ),
        )
    post_count = conn.execute("SELECT COUNT(*) AS count FROM community_posts").fetchone()["count"]
    if not post_count and admin:
        group = conn.execute("SELECT * FROM community_groups ORDER BY id LIMIT 1").fetchone()
        if group:
            post_cursor = conn.execute(
                """
                INSERT INTO community_posts
                    (group_id, domain_id, author_id, post_type, title, content, event_date)
                VALUES (?, ?, ?, 'announcement', ?, ?, ?)
                """,
                (
                    group["id"],
                    group["domain_id"],
                    admin["id"],
                    "Welcome to the LYTIX community",
                    "Use this space for weekly updates, peer support, events, and project discussions.",
                    (date.today() + timedelta(days=7)).isoformat(),
                ),
            )
            if students:
                conn.execute(
                    """
                    INSERT INTO community_comments (post_id, author_id, content)
                    VALUES (?, ?, ?)
                    """,
                    (post_cursor.lastrowid, students[0]["id"], "Excited to collaborate with the cohort."),
                )

    hackathon_count = conn.execute("SELECT COUNT(*) AS count FROM hackathons").fetchone()["count"]
    if not hackathon_count:
        cursor = conn.execute(
            """
            INSERT INTO hackathons (domain_id, title, description, deadline, prize, created_by)
            VALUES (1, 'LYTIX Build Sprint', 'Build a practical portfolio project with documentation and demo.', ?, 'Featured talent profile + certificate badge', ?)
            """,
            ((date.today() + timedelta(days=21)).isoformat(), admin["id"] if admin else None),
        )
        if students:
            conn.execute(
                """
                INSERT OR IGNORE INTO hackathon_registrations
                    (hackathon_id, student_id, project_link, score, status, submitted_at)
                VALUES (?, ?, ?, 91, 'Submitted', CURRENT_TIMESTAMP)
                """,
                (cursor.lastrowid, students[0]["id"], "https://github.com/lytix/build-sprint-demo"),
            )

    email_count = conn.execute("SELECT COUNT(*) AS count FROM email_logs").fetchone()["count"]
    if not email_count:
        email_types = [
            ("registration", "Welcome to LYTIX TECHNOLOGIES"),
            ("selection", "Internship selection update"),
            ("payment_confirmation", "Payment confirmation"),
            ("offer_letter", "Offer letter issued"),
            ("certificate", "Certificate issued"),
            ("job_alert", "New job alert for your domain"),
        ]
        for application in conn.execute(
            """
            SELECT applications.id AS application_id, applications.student_id, users.email
            FROM applications
            JOIN users ON users.id = applications.student_id
            ORDER BY applications.id
            LIMIT 2
            """
        ).fetchall():
            for email_type, subject in email_types:
                conn.execute(
                    """
                    INSERT INTO email_logs
                        (user_id, application_id, email_type, recipient_email, subject, status, metadata)
                    VALUES (?, ?, ?, ?, ?, 'Queued', ?)
                    """,
                    (
                        application["student_id"],
                        application["application_id"],
                        email_type,
                        application["email"],
                        subject,
                        json.dumps({"placeholder": True}),
                    ),
                )


def _ensure_document_columns(conn) -> None:
    existing = {
        row["name"]
        for row in conn.execute("PRAGMA table_info(documents)").fetchall()
    }
    columns = {
        "application_id": "INTEGER",
        "student_id": "INTEGER",
        "document_type": "TEXT",
        "document_number": "TEXT",
        "verification_id": "TEXT",
        "issue_date": "TEXT",
        "status": "TEXT DEFAULT 'Issued'",
        "revoked_reason": "TEXT",
        "pdf_path": "TEXT",
        "created_at": "TEXT DEFAULT CURRENT_TIMESTAMP",
    }
    for name, definition in columns.items():
        if name not in existing:
            conn.execute(f"ALTER TABLE documents ADD COLUMN {name} {definition}")


def _seed_documents(conn) -> None:
    first_app = conn.execute(
        """
        SELECT applications.id AS application_id, applications.student_id
        FROM applications
        ORDER BY applications.id
        LIMIT 1
        """
    ).fetchone()
    if not first_app:
        return
    certificate = conn.execute(
        "SELECT certificate_id, issue_date FROM certificates WHERE application_id = ?",
        (first_app["application_id"],),
    ).fetchone()
    if certificate:
        conn.execute(
            """
            INSERT OR IGNORE INTO documents
                (application_id, student_id, document_type, document_number, verification_id, issue_date, status, pdf_path)
            VALUES (?, ?, 'certificate', ?, ?, ?, 'Issued', ?)
            """,
            (
                first_app["application_id"],
                first_app["student_id"],
                certificate["certificate_id"],
                certificate["certificate_id"],
                certificate["issue_date"],
                f"generated/{certificate['certificate_id']}.pdf",
            ),
        )


def _seed_support(conn) -> None:
    count = conn.execute("SELECT COUNT(*) AS count FROM support_tickets").fetchone()["count"]
    if count:
        return
    student = conn.execute("SELECT id FROM users WHERE email = ?", ("student@lytix.tech",)).fetchone()
    admin = conn.execute("SELECT id FROM users WHERE email = ?", ("admin@lytix.tech",)).fetchone()
    recruiter = conn.execute("SELECT id FROM users WHERE email = ?", ("recruiter@lytix.tech",)).fetchone()
    samples = [
        (
            "LYTIX-TKT-0001",
            student["id"] if student else 1,
            admin["id"] if admin else None,
            "Certificate Issues",
            "Certificate verification link help",
            "I need help understanding the QR verification link on my certificate.",
            "High",
            "In Progress",
            "Admin is checking the document verification record.",
        ),
        (
            "LYTIX-TKT-0002",
            recruiter["id"] if recruiter else 1,
            admin["id"] if admin else None,
            "Candidate Issues",
            "Need verified candidate profile details",
            "Please confirm whether shortlisted candidates have verified credentials.",
            "Medium",
            "Open",
            "",
        ),
    ]
    for ticket in samples:
        cursor = conn.execute(
            """
            INSERT OR IGNORE INTO support_tickets
                (ticket_id, created_by, assigned_to, category, subject, description, priority, status, resolution_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            ticket,
        )
        ticket_pk = cursor.lastrowid
        if ticket_pk:
            conn.execute(
                """
                INSERT INTO support_ticket_messages (ticket_id, sender_id, message)
                VALUES (?, ?, ?)
                """,
                (ticket_pk, ticket[1], ticket[5]),
            )
