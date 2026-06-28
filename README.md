# LYTIX TECHNOLOGIES Internship Management Platform

Full-stack MVP for managing internship applications, student workflows, payments, offer letters, tasks, LinkedIn updates, completion certificates, experience letters, LORs, and public QR verification.

## Features

- Premium dark glassmorphism React UI
- Student registration with email OTP, mobile OTP, and JWT login after verification
- Admin login with role-based access
- Internship domains with 10 seeded tracks
- Student application workflow:
  `Apply -> Test -> Selection -> Payment -> Offer Letter -> Tasks -> Final Project -> LinkedIn Update -> Certificate`
- Mock Razorpay payment order and payment success
- Offer letter PDF generation
- Completion certificate PDF generation
- QR certificate verification
- Student dashboard with sidebar, cards, tracker, tasks, project form, checklist, and downloads
- Admin dashboard with analytics, domain-wise enrollments, students, applications, decisions, payment updates, task assignment, project review, and certificate generation
- Phase 3 LMS with learning materials, attendance, weekly assignments, quiz attempts, progress cards, and admin LMS management
- Phase 4 project management with domain projects, multi-link submissions, admin review, marks, feedback, and certificate eligibility gates
- Phase 5 document system with advanced certificates, experience letters, LOR eligibility, student document wallet, admin document management, revocation, and unified verification
- Phase 6 LinkedIn workflow, placement cell, resume tools, job alerts, and public talent directory
- Phase 7 AI tools plus global LYTIX AI Assistant with Gemini integration and free fallback mode
- Phase 8 enterprise layer with HR, recruiter, mentor teams, community, hackathons, email logs, and super-admin analytics
- SQLite database with seed data
- Error handling for invalid login, duplicate email, unauthorized access, missing applications, pending payment, and missing certificates

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: FastAPI
- Database: SQLite
- Auth: JWT
- PDF: ReportLab when installed, with local fallback PDF renderer
- QR: qrcode matrix with SVG and PDF rendering
- Payment: Razorpay placeholder/mock flow

## Folder Structure

```text
backend/
  app/
    auth/            JWT, auth middleware, role dependencies
    database/        SQLite connection, schema, seed data
    models/          Workflow constants and domain seed metadata
    routes/          Auth, domains, student, admin, LMS, documents, verification APIs
    schemas/         Pydantic request schemas, including LMS and AI payloads
    services/        Backend services, including Gemini-powered AI assistant integration
    utils/           PDF, QR, response helpers
    main.py          FastAPI app entrypoint
    pdf.py           Fallback PDF and QR primitives
  data/              SQLite database is created here
  requirements.txt
frontend/
  src/
    components/      Navbar, dashboard shell, workflow tracker, glass panels
    lib/             API and auth client helpers
    pages/           Landing, domains, auth, apply, dashboards, LMS, verification
    App.jsx
    index.css
```

## Default Login

```text
Admin
Email: admin@lytix.tech
Password: password123

HR
Email: hr@lytix.tech
Password: password123

Recruiter
Email: recruiter@lytix.tech
Password: password123

Mentor
Email: mentor@lytix.tech
Password: password123

Super Admin
Email: superadmin@lytix.tech
Password: password123

Student
Email: student@lytix.tech
Password: Student@123

Additional sample students
Email: nisha@lytix.tech
Password: Student@123

Email: karan@lytix.tech
Password: Student@123
```

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

Backend URL:

```text
http://localhost:8000
```

Health check:

```text
http://localhost:8000/api/health
```

Optional Gemini setup for real LYTIX AI chat:

```text
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

If `GEMINI_API_KEY` is empty or Gemini is unavailable, `/api/ai/ask` returns safe free fallback guidance.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Frontend Pages

```text
/                         Landing page
/domains                  Internship domains
/talent                   Public talent directory
/auth                     Login/register
/apply                    Internship application
/dashboard                Student dashboard
/learning                 Student LMS: materials, attendance, assignments, quizzes, progress
/project                  Student project submission and project status
/documents                Student document wallet: offer letter, certificate, experience letter, LOR
/linkedin                 Student LinkedIn workflow and completion tracking
/placement                Student placement cell
/resume                   Student resume tools and ATS placeholder
/jobs                     Student domain job alerts
/ai-tools                 Student AI tools: domain recommendation, resume analyzer, roadmap, interview, project, code
/community                Domain-wise community groups, posts, comments, announcements, events
/hackathons               Hackathon registration, submissions, and leaderboard
/admin                    Admin dashboard
/admin/lms                Admin LMS management
/admin/projects           Admin project management
/admin/project-reviews    Admin project submission review
/admin/documents          Admin document eligibility, issue, download, and revoke
/admin/placement          Admin placement management
/admin/job-alerts         Admin job alert management
/admin/resume-review      Admin resume review
/admin/ai-insights        Admin AI insights
/admin/email-logs         Email automation placeholder logs
/hr                       HR candidate pipeline dashboard
/recruiter                Recruiter talent search and shortlisting
/teams                    Admin/mentor team management
/super-admin              Super admin platform analytics and role management placeholder
/verify/{verification_id} Public document verification
```

## Environment

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Common values:

```text
JWT_SECRET=change-this-in-production
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173
RAZORPAY_KEY_ID=rzp_test_placeholder
SMS_PROVIDER=console
FAST2SMS_API_KEY=
MSG91_AUTH_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
VITE_API_URL=http://localhost:8000/api
```

## OTP Verification Workflow

Student registration requires both email and Indian mobile number verification.

```text
Register student
-> Backend generates separate 6 digit email and mobile OTPs
-> OTP hashes are stored in SQLite
-> OTPs expire after 10 minutes
-> Maximum 5 wrong attempts per channel
-> Account becomes login-ready only after both email and mobile are verified
```

Development mode:

```text
SMS_PROVIDER=console
```

In console mode the backend prints the mobile OTP in the backend terminal. The local email placeholder also prints the email OTP in the backend terminal and stores an email automation log. OTPs are never returned in API responses.

Provider placeholders:

```text
SMS_PROVIDER=fast2sms  FAST2SMS_API_KEY=...
SMS_PROVIDER=msg91     MSG91_AUTH_KEY=...
SMS_PROVIDER=twilio    TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_PHONE_NUMBER=...
```

## API Endpoints

Public:

```text
GET    /api/health
GET    /api/domains
POST   /api/auth/register
POST   /api/auth/verify-email-otp
POST   /api/auth/resend-email-otp
POST   /api/auth/verify-mobile-otp
POST   /api/auth/resend-mobile-otp
POST   /api/auth/login
GET    /api/verify/{verification_id}
GET    /api/certificates/{verification_id}/qr.svg
GET    /api/talent-directory
```

Student:

```text
GET    /api/auth/me
GET    /api/students/dashboard
POST   /api/applications
GET    /api/applications/me
GET    /api/applications/{id}/status
POST   /api/applications/{id}/payment
POST   /api/applications/{id}/payment/mock-success
GET    /api/applications/{id}/tasks
PATCH  /api/applications/{id}/final-project
PATCH  /api/applications/{id}/checklist
POST   /api/documents/offer-letter/{id}
POST   /api/documents/certificate/{id}
GET    /api/documents/eligibility/me
GET    /api/documents/me
GET    /api/documents/{verification_id}/download
POST   /api/documents/experience-letter/{id}
POST   /api/documents/lor/{id}
GET    /api/learning/materials/me
PATCH  /api/learning/materials/{material_id}/progress
GET    /api/attendance/me
GET    /api/assignments/me
POST   /api/assignments/{assignment_id}/submit
GET    /api/quizzes/me
POST   /api/quizzes/{quiz_id}/attempt
GET    /api/quizzes/results/me
GET    /api/projects/me
GET    /api/projects/status/me
POST   /api/projects/submit
GET    /api/linkedin/me
PATCH  /api/linkedin/me
GET    /api/linkedin/applications/{application_id}
PATCH  /api/linkedin/applications/{application_id}
GET    /api/placement/me
PUT    /api/placement/resume
POST   /api/placement/mock-interview
GET    /api/job-alerts/me
GET    /api/job-alerts
POST   /api/ai/ask
POST   /api/ai/recommend-domain
POST   /api/ai/resume/analyze
POST   /api/ai/roadmap
POST   /api/ai/interview/questions
POST   /api/ai/interview/submit
POST   /api/ai/project-review
POST   /api/ai/code/analyze
GET    /api/community/groups
GET    /api/community/posts
POST   /api/community/posts
GET    /api/community/posts/{post_id}/comments
POST   /api/community/posts/{post_id}/comments
GET    /api/hackathons
POST   /api/hackathons/{hackathon_id}/register
POST   /api/hackathons/{hackathon_id}/submit
GET    /api/hackathons/{hackathon_id}/leaderboard
```

Admin:

```text
GET    /api/admin/dashboard
GET    /api/admin/students
GET    /api/admin/applications
PATCH  /api/admin/applications/{id}
PATCH  /api/admin/applications/{id}/decision
PATCH  /api/admin/applications/{id}/payment
POST   /api/admin/applications/{id}/tasks
PATCH  /api/admin/tasks/{task_id}
PATCH  /api/admin/applications/{id}/project-review
POST   /api/admin/applications/{id}/certificate
POST   /api/learning/materials
GET    /api/learning/materials/domain/{domain_id}
POST   /api/attendance/mark
GET    /api/attendance/student/{student_id}
POST   /api/assignments
GET    /api/assignments/domain/{domain_id}
GET    /api/admin/submissions
PATCH  /api/assignments/submissions/{submission_id}/review
POST   /api/quizzes
GET    /api/quizzes/domain/{domain_id}
GET    /api/admin/quiz-results
POST   /api/projects
GET    /api/projects/domain/{domain_id}
GET    /api/projects/submissions
PATCH  /api/projects/submissions/{submission_id}/review
GET    /api/documents
GET    /api/documents/eligibility/{application_id}
POST   /api/documents/certificate/{application_id}
POST   /api/documents/experience-letter/{application_id}
POST   /api/documents/lor/{application_id}
PATCH  /api/documents/{verification_id}/revoke
GET    /api/admin/placement/resumes
PATCH  /api/admin/placement/resumes/{student_id}
PATCH  /api/admin/placement/status/{student_id}
POST   /api/admin/job-alerts
GET    /api/admin/job-alerts
GET    /api/admin/ai/insights
GET    /api/hr/dashboard
GET    /api/hr/applications
PATCH  /api/hr/applications/{application_id}
GET    /api/recruiter/search
POST   /api/recruiter/shortlists
GET    /api/recruiter/shortlists
POST   /api/recruiter/contact-request
GET    /api/teams
POST   /api/teams
PATCH  /api/teams/{team_id}
POST   /api/teams/{team_id}/members
GET    /api/teams/{team_id}/progress
POST   /api/hackathons
GET    /api/email-logs
POST   /api/email-logs
GET    /api/super-admin/analytics
PATCH  /api/super-admin/users/{user_id}/role
```

The global LYTIX AI Assistant uses `POST /api/ai/ask`. When `GEMINI_API_KEY` is set in `backend/.env` or the backend environment, the backend calls Gemini from the server only. The key is never exposed to React. When the key is missing or Gemini returns an error, the endpoint responds with `provider: "free-fallback"` and a safe contextual fallback answer.

The older Phase 7 tool endpoints remain available for structured student AI tools and analytics history.

Phase 8 roles:

```text
student
mentor
admin
hr
recruiter
super_admin
```

Phase 5 certificate generation requires:

```text
Payment completed
Attendance minimum 70%
Assignments completed
Final project approved
LinkedIn checklist completed
```

Phase 6 LinkedIn checklist includes:

```text
LinkedIn profile URL
Profile updated
Headline updated
Completion post published
Tasks documented
Certificate shared
Internship experience added
Certificate added
Project posted
Company page followed
```

Placement statuses:

```text
Not Started
Resume Reviewed
Mock Interview Done
Shortlisted
Placed
```

Experience letters use the same completion eligibility as certificates.

LOR generation is limited to top performers:

```text
Attendance above 85%
Project marks above 80%
Assignment completion above 90%
```

## Database Tables

```text
users
internship_domains
applications
payments
tasks
certificates
documents
linkedin_checklist
placement_profiles
job_alerts
learning_materials
material_progress
attendance
weekly_assignments
assignment_submissions
quizzes
quiz_questions
quiz_options
quiz_results
projects
project_submissions
ai_recommendation_history
resume_analysis_results
interview_attempts
project_review_results
code_analysis_history
candidate_pipeline
recruiter_shortlists
teams
team_members
community_groups
community_posts
community_comments
hackathons
hackathon_registrations
email_logs
```

Seed data includes:

- 10 internship domains
- 1 admin user
- 3 sample students
- Sample applications
- Sample payments
- Sample tasks
- Weekly LMS materials for all 10 domains
- Sample attendance records
- Sample assignments and reviewed submission
- Sample quizzes and quiz result
- Sample projects for all 10 domains
- Sample approved project submission
- Sample verified certificate and document record: `LYTIX-SAMPLE-VERIFY`
- Sample placement profiles, ATS scores, resume feedback, and job alerts for all 10 domains
- Sample AI recommendation, resume analysis, interview attempt, project review, and code analysis history
- HR, recruiter, mentor, and super-admin sample users
- Default teams: Team Alpha, Team Beta, Team Gamma, Team Delta
- Candidate pipeline, recruiter shortlist, community group/post/comment, hackathon, and email log seed data

## Testing OTP Registration

1. Start the backend with `SMS_PROVIDER=console`.
2. Open `/auth`, switch to Register, and enter a valid email plus Indian mobile number such as `9876543210`.
3. Watch the backend terminal for `[LYTIX EMAIL OTP]` and `[LYTIX SMS OTP]` lines.
4. Enter each 6 digit OTP in the verification panel.
5. After both badges show Verified, click `Go to Login` and login with the new account.
6. Try logging in before both OTPs are verified to confirm the API returns: `Please verify your email and mobile number before login.`

## Testing LMS Features

1. Start backend and frontend.
2. Login as `student@lytix.tech` / `Student@123`.
3. Open `/learning`.
4. Mark a material completed, submit an assignment link, and attempt a quiz.
5. Login as `admin@lytix.tech` / `password123`.
6. Open `/admin/lms`.
7. Add a material, mark attendance, create an assignment, create a quiz, and review submissions.

## Testing Project Features

1. Login as `student@lytix.tech` / `Student@123`.
2. Open `/project`.
3. Review the assigned project and submit GitHub, documentation, PPT, and demo video links.
4. Login as `admin@lytix.tech` / `password123`.
5. Open `/admin/projects` to create or view domain projects.
6. Open `/admin/project-reviews` to review project submissions, assign marks, add feedback, and approve projects.
7. Return to the student dashboard to verify project status, marks, and certificate readiness.

## Testing Phase 5 Documents

1. Login as `student@lytix.tech` / `Student@123`.
2. Open `/documents`.
3. Review eligibility cards and generate/download the certificate, experience letter, and LOR.
4. Use the Verify button or open `/verify/LYTIX-SAMPLE-VERIFY` to see public document verification with QR preview.
5. Login as `admin@lytix.tech` / `password123`.
6. Open `/admin/documents`.
7. Generate documents for eligible students, download issued PDFs, and test revocation with a reason.

## Testing Phase 6 Placement and Talent

1. Login as `student@lytix.tech` / `Student@123`.
2. Open `/linkedin` and confirm LinkedIn completion is 100% for the seeded student.
3. Open `/placement` and save a resume URL, GitHub URL, and request a mock interview.
4. Open `/resume` to view the ATS score placeholder and resume feedback.
5. Open `/jobs` to view domain-specific job alerts.
6. Login as `admin@lytix.tech` / `password123`.
7. Open `/admin/placement` or `/admin/resume-review` to update ATS score, feedback, and placement status.
8. Open `/admin/job-alerts` to create a domain-specific job alert.
9. Open `/talent` publicly and filter profiles by domain, skills, and placement status.

## Testing Phase 7 AI Tools

1. Optional: add `GEMINI_API_KEY` to `backend/.env` and restart FastAPI.
2. Open any route and click `Ask LYTIX AI`.
3. Choose Assignment Helper, Coding Assistant, Resume Analyzer, Interview Simulator, Career Roadmap, Project Reviewer, or Domain Recommendation.
4. Ask a question and confirm the response label shows `Powered by Gemini` when the key works, or `Fallback mode` when the key is missing.
5. Login as `student@lytix.tech` / `Student@123`.
6. Open `/ai-tools`.
7. Run domain recommendation using skills, branch, interests, and career goal.
8. Run resume analysis with pasted resume text or a resume URL placeholder.
9. Generate a roadmap for the selected internship domain.
10. Generate interview questions, enter answers, and submit for score and feedback.
11. Review the final project links and README text with the AI project reviewer.
12. Paste code into the coding assistant and run local code analysis.
13. Login as `admin@lytix.tech` / `password123`.
14. Open `/admin/ai-insights` to review recommended domains, average ATS score, common missing skills, interview average score, and project review average score.

## Testing Phase 8 Enterprise Features

1. Login as `hr@lytix.tech` / `password123`.
2. Open `/hr`, shortlist a candidate, set an interview date, and update candidate status.
3. Login as `recruiter@lytix.tech` / `password123`.
4. Open `/recruiter`, filter talent by skills, ATS score, and project score, then shortlist a student.
5. Login as `mentor@lytix.tech` / `password123`.
6. Open `/teams` to view default teams and team progress.
7. Login as `student@lytix.tech` / `Student@123`.
8. Open `/community`, create a discussion post, and add a comment.
9. Open `/hackathons`, register, submit a project link, and view the leaderboard.
10. Login as `admin@lytix.tech` / `password123`.
11. Open `/admin/email-logs` to create and review placeholder email automation logs.
12. Login as `superadmin@lytix.tech` / `password123`.
13. Open `/super-admin` to review platform analytics and the role management placeholder.

## Future Improvements

- Real Razorpay checkout and webhook verification
- Email notifications for selection, payment, offer letter, and certificate issue
- Mentor assignment and mentor dashboard
- Task submissions with file uploads
- Admin notes and audit trail
- LMS lesson completion analytics by week
- Quiz question bank import/export
- Project rubrics and milestone-based review
- Plagiarism checks for project submissions
- Real resume parsing and ATS scoring
- Recruiter access controls for talent directory
- Placement interview calendar and email reminders
- Expand LYTIX AI Assistant with streaming responses, chat history, and optional provider selection
- Real SMTP provider integration and recruiter messaging workflow
- Organization/team-level permissions and audit history
- Production database migrations with Alembic
- Cloud object storage for generated PDFs
- Rich certificate templates with brand assets
