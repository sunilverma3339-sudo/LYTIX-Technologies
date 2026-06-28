import json
import re
from collections import Counter
from statistics import mean
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.auth.dependencies import require_admin, require_student, state_user
from app.database import get_connection, row_to_dict
from app.routes.common import application_row, placement_profile_for_user
from app.schemas import (
    AIAskRequest,
    AIAskResponse,
    AIProjectReviewRequest,
    CodeAnalysisRequest,
    DomainRecommendationRequest,
    InterviewQuestionRequest,
    InterviewSubmitRequest,
    ResumeAnalysisRequest,
    RoadmapRequest,
)
from app.services.ai_service import ask_lytix_ai


router = APIRouter(tags=["ai-tools"])

BRANCH_HINTS = {
    "computer": ["Python Development", "Web Development MERN Stack", "Machine Learning and AI"],
    "cse": ["Python Development", "Web Development MERN Stack", "Machine Learning and AI"],
    "it": ["Web Development MERN Stack", "Cloud Computing and DevOps"],
    "electronics": ["IoT and Embedded Systems", "PLC and SCADA Automation"],
    "electrical": ["PLC and SCADA Automation", "IoT and Embedded Systems"],
    "mechanical": ["PLC and SCADA Automation", "IoT and Embedded Systems"],
    "design": ["UI/UX Design", "Mobile App Development"],
    "data": ["Data Science and Analytics", "Machine Learning and AI"],
}


@router.post("/ai/ask", response_model=AIAskResponse)
def ask_ai(payload: AIAskRequest, request: Request) -> dict[str, str]:
    user = state_user(request)
    role = (user or {}).get("role") or payload.role or "guest"
    return ask_lytix_ai(
        tool=payload.tool,
        message=payload.message,
        route=payload.route or "/",
        role=role,
        user=user,
    )


@router.post("/ai/recommend-domain")
def recommend_domain(
    payload: DomainRecommendationRequest,
    user: dict = Depends(require_student),
) -> dict:
    application = _latest_application(user["id"], required=False)
    profile_text = _profile_text(payload, application, user)
    domains = _domains()
    if not domains:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No internship domains found")

    scored = []
    for domain in domains:
        domain_text = " ".join([domain["name"], domain["summary"], " ".join(domain["skills"])])
        skill_hits = _matched_skills(profile_text, domain["skills"])
        interest_hits = len(_tokens(profile_text) & _tokens(domain_text))
        branch_bonus = _branch_bonus(payload.branch or "", domain["name"])
        current_bonus = 8 if application and application["domain"]["id"] == domain["id"] else 0
        score = min(98, 42 + len(skill_hits) * 11 + min(interest_hits, 5) * 4 + branch_bonus + current_bonus)
        scored.append((score, skill_hits, domain))

    score, hits, domain = sorted(scored, key=lambda item: item[0], reverse=True)[0]
    suggested_skills = [skill for skill in domain["skills"] if skill.lower() not in profile_text.lower()]
    if not suggested_skills:
        suggested_skills = domain["skills"][:3]
    reason = (
        f"Your profile overlaps with {', '.join(hits[:3])}."
        if hits
        else f"Your branch and interests point toward {domain['name']} as a strong starting track."
    )
    input_profile = {
        "skills": payload.skills or application.get("skills") if application else payload.skills,
        "branch": payload.branch,
        "interests": payload.interests,
        "career_goal": payload.career_goal,
    }
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO ai_recommendation_history
                (student_id, domain_id, recommended_domain, match_percentage, reason, suggested_skills, input_profile)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                domain["id"],
                domain["name"],
                score,
                reason,
                json.dumps(suggested_skills),
                json.dumps(input_profile),
            ),
        )
    return {
        "id": cursor.lastrowid,
        "recommended_domain": domain,
        "match_percentage": score,
        "reason": reason,
        "suggested_skills": suggested_skills,
    }


@router.post("/ai/resume/analyze")
def analyze_resume(
    payload: ResumeAnalysisRequest,
    user: dict = Depends(require_student),
) -> dict:
    application = _latest_application(user["id"], required=False)
    domain_skills = application["domain"]["skills"] if application else _all_known_skills()[:6]
    profile = placement_profile_for_user(user["id"], application)
    resume_text = " ".join(
        [
            payload.resume_text or "",
            payload.resume_url or "",
            profile.get("resume_url") or "",
            profile.get("github_url") or "",
            (application.get("skills") or "") if application else "",
            (application.get("final_project_url") or "") if application else "",
        ]
    )
    ats_score, missing, strengths, weaknesses, suggestions = _resume_score(resume_text, domain_skills)
    resume_url = payload.resume_url or profile.get("resume_url") or ""
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO resume_analysis_results
                (student_id, ats_score, missing_skills, strengths, weaknesses,
                 improvement_suggestions, resume_url, source_text)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                ats_score,
                json.dumps(missing),
                json.dumps(strengths),
                json.dumps(weaknesses),
                json.dumps(suggestions),
                resume_url,
                resume_text[:5000],
            ),
        )
        conn.execute(
            """
            INSERT INTO placement_profiles
                (student_id, application_id, resume_url, github_url, ats_score, resume_feedback, improvement_suggestions)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(student_id)
            DO UPDATE SET ats_score = excluded.ats_score,
                resume_url = COALESCE(NULLIF(excluded.resume_url, ''), placement_profiles.resume_url),
                resume_feedback = excluded.resume_feedback,
                improvement_suggestions = excluded.improvement_suggestions,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                user["id"],
                application["id"] if application else None,
                resume_url,
                profile.get("github_url") or "",
                ats_score,
                "; ".join(strengths[:2] + weaknesses[:1]),
                "; ".join(suggestions),
            ),
        )
    return {
        "id": cursor.lastrowid,
        "ats_score": ats_score,
        "missing_skills": missing,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "improvement_suggestions": suggestions,
    }


@router.post("/ai/roadmap")
def generate_roadmap(payload: RoadmapRequest, user: dict = Depends(require_student)) -> dict:
    application = _latest_application(user["id"], required=False)
    domain = _domain_by_request(payload, application)
    if not domain:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found")
    skills = domain["skills"]
    return {
        "domain": domain,
        "beginner_skills": ["Git basics", "Problem decomposition", *skills[:2]],
        "intermediate_skills": [*skills[1:4], "Testing", "Documentation"],
        "advanced_skills": [*skills[-2:], "Deployment", "Performance review"],
        "projects_to_build": [
            f"{domain['name']} starter portfolio project",
            f"{domain['name']} dashboard or automation workflow",
            f"Capstone with documentation and demo for {domain['name']}",
        ],
        "job_roles": _job_roles(domain["name"]),
        "learning_timeline": [
            {"week": "1-2", "focus": "Core tools, setup, and fundamentals"},
            {"week": "3-4", "focus": "Guided mini project and mentor review"},
            {"week": "5-6", "focus": "Capstone implementation and documentation"},
            {"week": "7-8", "focus": "Portfolio polish, LinkedIn, and interview prep"},
        ],
    }


@router.post("/ai/interview/questions")
def generate_interview_questions(
    payload: InterviewQuestionRequest,
    user: dict = Depends(require_student),
) -> dict:
    application = _latest_application(user["id"], required=False)
    domain = _domain_by_request(RoadmapRequest(domain_id=payload.domain_id), application)
    if not domain:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found")
    questions = _interview_questions(domain, payload.interview_type)
    return {"domain": domain, "interview_type": payload.interview_type, "questions": questions}


@router.post("/ai/interview/submit")
def submit_interview_answers(
    payload: InterviewSubmitRequest,
    user: dict = Depends(require_student),
) -> dict:
    application = _latest_application(user["id"], required=False)
    domain = _domain_by_request(RoadmapRequest(domain_id=payload.domain_id), application)
    if not domain:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found")
    answers = payload.answers or []
    if not answers:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="At least one answer is required")
    score, feedback = _score_interview(answers, domain)
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO interview_attempts
                (student_id, domain_id, interview_type, questions, answers, feedback, score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                domain["id"],
                payload.interview_type,
                json.dumps([answer.question for answer in answers]),
                json.dumps([answer.answer for answer in answers]),
                feedback,
                score,
            ),
        )
    return {"id": cursor.lastrowid, "score": score, "feedback": feedback}


@router.post("/ai/project-review")
def review_project_with_ai(
    payload: AIProjectReviewRequest,
    user: dict = Depends(require_student),
) -> dict:
    application = _latest_application(user["id"], required=False)
    submission = _latest_project_submission(user["id"], application["domain"]["id"] if application else None)
    github_link = payload.github_link or (submission.get("github_link") if submission else "")
    documentation_link = payload.documentation_link or (submission.get("documentation_link") if submission else "")
    demo_video_link = payload.demo_video_link or (submission.get("demo_video_link") if submission else "")
    score, readme_quality, suggestions = _project_score(
        github_link,
        documentation_link,
        demo_video_link,
        payload.readme_text or "",
    )
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO project_review_results
                (student_id, project_submission_id, github_link, documentation_link, demo_video_link,
                 readme_quality, final_score, suggestions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                submission.get("id") if submission else None,
                github_link,
                documentation_link,
                demo_video_link,
                readme_quality,
                score,
                json.dumps(suggestions),
            ),
        )
    return {
        "id": cursor.lastrowid,
        "checks": {
            "github_link_present": bool(github_link),
            "documentation_link_present": bool(documentation_link),
            "demo_video_present": bool(demo_video_link),
            "readme_quality": readme_quality,
        },
        "final_score": score,
        "suggestions": suggestions,
    }


@router.post("/ai/code/analyze")
def analyze_code(payload: CodeAnalysisRequest, user: dict = Depends(require_student)) -> dict:
    result = _code_feedback(payload.code, payload.language or "plain text")
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO code_analysis_history
                (student_id, language, code_snippet, explanation, bug_suggestions, optimization_tips, best_practices)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                payload.language or "",
                payload.code[:12000],
                result["code_explanation"],
                json.dumps(result["bug_suggestions"]),
                json.dumps(result["optimization_tips"]),
                json.dumps(result["best_practices"]),
            ),
        )
    return {"id": cursor.lastrowid, **result}


@router.get("/admin/ai/insights")
def admin_ai_insights(_: dict = Depends(require_admin)) -> dict:
    with get_connection() as conn:
        recommendation_rows = conn.execute(
            """
            SELECT recommended_domain, COUNT(*) AS count, ROUND(AVG(match_percentage), 2) AS average_match
            FROM ai_recommendation_history
            GROUP BY recommended_domain
            ORDER BY count DESC, average_match DESC
            """
        ).fetchall()
        resume_rows = conn.execute("SELECT ats_score, missing_skills FROM resume_analysis_results").fetchall()
        interview_rows = conn.execute("SELECT score FROM interview_attempts").fetchall()
        project_rows = conn.execute("SELECT final_score FROM project_review_results").fetchall()
        code_count = conn.execute("SELECT COUNT(*) AS count FROM code_analysis_history").fetchone()["count"]

    missing_counter: Counter[str] = Counter()
    for row in resume_rows:
        missing_counter.update(_json_list(row["missing_skills"]))
    return {
        "most_recommended_domains": [dict(row) for row in recommendation_rows],
        "average_ats_score": _average([row["ats_score"] for row in resume_rows]),
        "common_missing_skills": [
            {"skill": skill, "count": count}
            for skill, count in missing_counter.most_common(8)
        ],
        "interview_average_score": _average([row["score"] for row in interview_rows]),
        "project_review_average_score": _average([row["final_score"] for row in project_rows]),
        "totals": {
            "recommendations": sum(row["count"] for row in recommendation_rows),
            "resume_analyses": len(resume_rows),
            "interview_attempts": len(interview_rows),
            "project_reviews": len(project_rows),
            "code_analyses": code_count,
        },
    }


def _latest_application(student_id: int, required: bool = True) -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM applications WHERE student_id = ? ORDER BY created_at DESC, id DESC LIMIT 1",
            (student_id,),
        ).fetchone()
    if row is None:
        if required:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
        return None
    return application_row(row["id"])


def _domains() -> list[dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM internship_domains ORDER BY id").fetchall()
    domains = []
    for row in rows:
        domain = dict(row)
        domain["skills"] = json.loads(domain.get("skills") or "[]")
        domains.append(domain)
    return domains


def _domain_by_request(payload: RoadmapRequest, application: dict[str, Any] | None) -> dict[str, Any] | None:
    domains = _domains()
    if payload.domain_id:
        return next((domain for domain in domains if domain["id"] == payload.domain_id), None)
    if payload.domain_name:
        needle = payload.domain_name.lower()
        return next((domain for domain in domains if needle in domain["name"].lower()), None)
    if application:
        return next((domain for domain in domains if domain["id"] == application["domain"]["id"]), None)
    return domains[0] if domains else None


def _profile_text(
    payload: DomainRecommendationRequest,
    application: dict[str, Any] | None,
    user: dict[str, Any],
) -> str:
    parts = [
        payload.skills or "",
        payload.branch or "",
        payload.interests or "",
        payload.career_goal or "",
        user.get("college") or "",
        application.get("skills") if application else "",
        application["domain"]["name"] if application else "",
    ]
    return " ".join(part for part in parts if part)


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9+#.]+", (text or "").lower()))


def _matched_skills(text: str, skills: list[str]) -> list[str]:
    lowered = text.lower()
    return [skill for skill in skills if skill.lower() in lowered]


def _branch_bonus(branch: str, domain_name: str) -> int:
    branch_text = branch.lower()
    for keyword, domains in BRANCH_HINTS.items():
        if keyword in branch_text and domain_name in domains:
            return 14
    return 0


def _all_known_skills() -> list[str]:
    skills = []
    for domain in _domains():
        skills.extend(domain["skills"])
    return sorted(set(skills))


def _resume_score(text: str, domain_skills: list[str]) -> tuple[int, list[str], list[str], list[str], list[str]]:
    lowered = text.lower()
    matched = _matched_skills(text, domain_skills)
    missing = [skill for skill in domain_skills if skill not in matched]
    quality_keywords = {
        "project": 8,
        "github": 8,
        "deployed": 8,
        "api": 6,
        "test": 6,
        "dashboard": 6,
        "mentor": 4,
        "internship": 4,
        "metrics": 6,
    }
    score = 42 + len(matched) * 8 + sum(points for keyword, points in quality_keywords.items() if keyword in lowered)
    score = max(35, min(98, score))
    strengths = []
    if matched:
        strengths.append(f"Relevant keywords found: {', '.join(matched[:4])}")
    if "github" in lowered:
        strengths.append("Project or GitHub evidence is visible")
    if "internship" in lowered or "project" in lowered:
        strengths.append("Experience narrative is present")
    if not strengths:
        strengths.append("The resume has enough base information for a first pass")
    weaknesses = []
    if missing:
        weaknesses.append(f"Missing domain keywords: {', '.join(missing[:4])}")
    if "metric" not in lowered and "%" not in lowered:
        weaknesses.append("Quantified outcomes are not visible")
    if "deployed" not in lowered and "live" not in lowered:
        weaknesses.append("Deployment or live demo evidence is light")
    suggestions = [
        "Add 3-5 domain keywords in the skills and project sections",
        "Add measurable impact such as speed, users, accuracy, or automation time saved",
        "Link GitHub, demo, and documentation near each project",
    ]
    if not missing:
        suggestions[0] = "Keep skills aligned to the target role and avoid keyword stuffing"
    return score, missing, strengths, weaknesses, suggestions


def _job_roles(domain_name: str) -> list[str]:
    mapping = {
        "Python Development": ["Python Intern", "Backend Developer", "Automation Engineer"],
        "Web Development MERN Stack": ["MERN Developer", "Frontend Engineer", "Full Stack Intern"],
        "Mobile App Development": ["Mobile App Intern", "React Native Developer", "App QA Associate"],
        "Machine Learning and AI": ["ML Intern", "AI Engineer Trainee", "NLP Associate"],
        "Data Science and Analytics": ["Data Analyst Intern", "BI Associate", "Analytics Engineer Trainee"],
        "Cyber Security": ["Security Analyst Intern", "SOC Trainee", "Web Security Tester"],
        "Cloud Computing and DevOps": ["DevOps Intern", "Cloud Support Associate", "Platform Engineer Trainee"],
        "UI/UX Design": ["UI/UX Intern", "Product Design Trainee", "UX Research Assistant"],
        "IoT and Embedded Systems": ["Embedded Intern", "IoT Developer Trainee", "Firmware Associate"],
        "PLC and SCADA Automation": ["Automation Intern", "PLC Programmer Trainee", "SCADA Engineer Assistant"],
    }
    return mapping.get(domain_name, ["Intern", "Associate Developer", "Project Trainee"])


def _interview_questions(domain: dict[str, Any], interview_type: str) -> list[str]:
    if interview_type == "HR Interview":
        return [
            "Tell me about yourself and your internship goals.",
            f"Why did you choose {domain['name']}?",
            "Describe a time you learned a difficult concept quickly.",
            "How do you handle feedback from a mentor or reviewer?",
            "What kind of role do you want after this internship?",
        ]
    skills = domain["skills"][:4]
    return [
        f"Explain one project you can build using {skills[0] if skills else domain['name']}.",
        f"What are the most important fundamentals in {domain['name']}?",
        f"How would you debug an issue in a {domain['name']} project?",
        f"Compare two tools or concepts from this domain: {', '.join(skills[:2])}.",
        "How would you document and present your final project to a hiring manager?",
    ]


def _score_interview(answers: list[Any], domain: dict[str, Any]) -> tuple[int, str]:
    skill_tokens = _tokens(" ".join(domain["skills"]))
    scores = []
    for answer in answers:
        text = answer.answer or ""
        length_score = min(45, len(text.split()) * 2)
        skill_score = min(30, len(_tokens(text) & skill_tokens) * 10)
        structure_score = 15 if any(word in text.lower() for word in ["because", "example", "project", "learned"]) else 6
        scores.append(20 + length_score + skill_score + structure_score)
    score = min(100, round(mean(scores))) if scores else 0
    if score >= 80:
        feedback = "Strong answers. Add concise metrics and one architecture-level example to make them interview-ready."
    elif score >= 60:
        feedback = "Good base. Add clearer examples, domain keywords, and a stronger result/action structure."
    else:
        feedback = "Needs practice. Keep answers specific, mention one project, and close with measurable learning."
    return score, feedback


def _latest_project_submission(student_id: int, domain_id: int | None) -> dict[str, Any] | None:
    if domain_id is None:
        return None
    with get_connection() as conn:
        return row_to_dict(
            conn.execute(
                """
                SELECT project_submissions.*
                FROM project_submissions
                JOIN projects ON projects.id = project_submissions.project_id
                WHERE project_submissions.student_id = ? AND projects.domain_id = ?
                ORDER BY project_submissions.submitted_at DESC, project_submissions.id DESC
                LIMIT 1
                """,
                (student_id, domain_id),
            ).fetchone()
        )


def _project_score(
    github_link: str,
    documentation_link: str,
    demo_video_link: str,
    readme_text: str,
) -> tuple[int, str, list[str]]:
    score = 0
    suggestions = []
    if github_link:
        score += 28 if "github" in github_link.lower() else 20
    else:
        suggestions.append("Add a public GitHub repository link")
    if documentation_link:
        score += 22
    else:
        suggestions.append("Add documentation with setup steps and screenshots")
    if demo_video_link:
        score += 20
    else:
        suggestions.append("Add a short demo video link")
    readme_tokens = _tokens(readme_text)
    readme_keywords = {"setup", "install", "usage", "features", "screenshot", "api", "demo", "test"}
    readme_hits = len(readme_tokens & readme_keywords)
    if len(readme_text) > 600 and readme_hits >= 4:
        readme_quality = "Strong"
        score += 30
    elif len(readme_text) > 180 or readme_hits >= 2:
        readme_quality = "Good"
        score += 20
    else:
        readme_quality = "Needs work"
        score += 8
        suggestions.append("Improve README with features, setup, usage, and test evidence")
    if not suggestions:
        suggestions.append("Add polish: screenshots, architecture notes, and measurable outcomes")
    return min(100, score), readme_quality, suggestions


def _code_feedback(code: str, language: str) -> dict[str, Any]:
    lines = [line for line in code.splitlines() if line.strip()]
    lowered = code.lower()
    functions = len(re.findall(r"\b(def|function|const|class)\b", code))
    explanation = (
        f"This {language} snippet has {len(lines)} meaningful lines and "
        f"{functions} visible function or class declarations. It appears to focus on "
        f"{'data/API handling' if any(word in lowered for word in ['fetch', 'api', 'request', 'sql']) else 'general program logic'}."
    )
    bugs = []
    if "todo" in lowered:
        bugs.append("Resolve TODO markers before final submission")
    if "password" in lowered or "api_key" in lowered or "secret" in lowered:
        bugs.append("Avoid hard-coded secrets or credentials")
    if "except:" in lowered:
        bugs.append("Use specific exception types instead of a bare except")
    if "eval(" in lowered:
        bugs.append("Avoid eval unless inputs are fully controlled")
    if not bugs:
        bugs.append("No obvious placeholder bug found by the local rule checker")
    optimization = []
    if len(lines) > 80:
        optimization.append("Split large blocks into smaller functions")
    if re.search(r"for .* in .*:\s*\n\s*for ", code):
        optimization.append("Review nested loops for avoidable repeated work")
    optimization.append("Cache repeated computations and keep I/O at clear boundaries")
    best = [
        "Add small tests around edge cases",
        "Use clear names for inputs, outputs, and side effects",
        "Document setup and expected behavior near the project README",
    ]
    return {
        "code_explanation": explanation,
        "bug_suggestions": bugs,
        "optimization_tips": optimization,
        "best_practices": best,
    }


def _json_list(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []


def _average(values: list[int | float]) -> float:
    filtered = [value for value in values if value is not None]
    return round(sum(filtered) / len(filtered), 2) if filtered else 0
