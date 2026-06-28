from typing import Optional

from pydantic import BaseModel, Field


class CandidatePipelineUpdate(BaseModel):
    candidate_status: Optional[str] = Field(default=None, max_length=80)
    shortlisted: Optional[bool] = None
    interview_date: Optional[str] = Field(default=None, max_length=40)
    notes: Optional[str] = Field(default="", max_length=1200)


class RecruiterShortlistRequest(BaseModel):
    student_id: int
    notes: Optional[str] = Field(default="", max_length=1000)


class RecruiterContactRequest(BaseModel):
    student_id: int
    notes: Optional[str] = Field(default="", max_length=1000)


class TeamCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    domain_id: Optional[int] = None
    mentor_id: Optional[int] = None
    lead_student_id: Optional[int] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    domain_id: Optional[int] = None
    mentor_id: Optional[int] = None
    lead_student_id: Optional[int] = None


class TeamMemberAdd(BaseModel):
    student_id: int


class CommunityPostCreate(BaseModel):
    group_id: Optional[int] = None
    domain_id: Optional[int] = None
    post_type: str = Field(default="discussion", pattern="^(discussion|announcement|event)$")
    title: str = Field(min_length=3, max_length=180)
    content: str = Field(min_length=3, max_length=3000)
    event_date: Optional[str] = Field(default=None, max_length=40)


class CommunityCommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class HackathonCreate(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    description: Optional[str] = Field(default="", max_length=2000)
    domain_id: Optional[int] = None
    deadline: Optional[str] = Field(default=None, max_length=40)
    prize: Optional[str] = Field(default="", max_length=300)


class HackathonSubmit(BaseModel):
    project_link: str = Field(min_length=5, max_length=600)


class EmailLogCreate(BaseModel):
    user_id: Optional[int] = None
    application_id: Optional[int] = None
    email_type: str = Field(min_length=2, max_length=80)
    recipient_email: str = Field(min_length=3, max_length=200)
    subject: str = Field(min_length=3, max_length=220)
    status: Optional[str] = Field(default="Queued", max_length=40)
    metadata: Optional[str] = Field(default="", max_length=2000)


class RoleManagementRequest(BaseModel):
    role: str = Field(pattern="^(student|mentor|admin|hr|recruiter|super_admin)$")
