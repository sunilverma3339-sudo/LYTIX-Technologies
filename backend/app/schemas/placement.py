from typing import Optional

from pydantic import BaseModel, Field


class LinkedInChecklistAdvancedUpdate(BaseModel):
    linkedin_url: Optional[str] = Field(default=None, max_length=300)
    profile_updated: Optional[bool] = None
    headline_updated: Optional[bool] = None
    post_published: Optional[bool] = None
    tasks_documented: Optional[bool] = None
    certificate_shared: Optional[bool] = None
    internship_experience_added: Optional[bool] = None
    certificate_added: Optional[bool] = None
    project_posted: Optional[bool] = None
    company_page_followed: Optional[bool] = None


class ResumeProfileUpdate(BaseModel):
    resume_url: Optional[str] = Field(default="", max_length=500)
    github_url: Optional[str] = Field(default="", max_length=300)


class AdminResumeReview(BaseModel):
    ats_score: Optional[int] = Field(default=None, ge=0, le=100)
    resume_feedback: Optional[str] = Field(default="", max_length=1200)
    improvement_suggestions: Optional[str] = Field(default="", max_length=1200)
    placement_status: Optional[str] = Field(default=None, max_length=40)


class PlacementStatusUpdate(BaseModel):
    placement_status: str = Field(
        pattern="^(Not Started|Resume Reviewed|Mock Interview Done|Shortlisted|Placed)$"
    )


class JobAlertCreate(BaseModel):
    domain_id: int
    company_name: str = Field(min_length=2, max_length=160)
    role: str = Field(min_length=2, max_length=160)
    location: Optional[str] = Field(default="", max_length=160)
    job_type: Optional[str] = Field(default="", max_length=80)
    skills_required: Optional[str] = Field(default="", max_length=600)
    apply_link: Optional[str] = Field(default="", max_length=500)
    deadline: Optional[str] = Field(default=None, max_length=30)
