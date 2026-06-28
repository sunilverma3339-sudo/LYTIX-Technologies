from typing import Optional

from pydantic import BaseModel, Field


class DomainRecommendationRequest(BaseModel):
    skills: Optional[str] = Field(default="", max_length=1000)
    branch: Optional[str] = Field(default="", max_length=160)
    interests: Optional[str] = Field(default="", max_length=1000)
    career_goal: Optional[str] = Field(default="", max_length=500)


class ResumeAnalysisRequest(BaseModel):
    resume_text: Optional[str] = Field(default="", max_length=5000)
    resume_url: Optional[str] = Field(default="", max_length=500)


class RoadmapRequest(BaseModel):
    domain_id: Optional[int] = None
    domain_name: Optional[str] = Field(default="", max_length=180)


class InterviewQuestionRequest(BaseModel):
    domain_id: Optional[int] = None
    interview_type: str = Field(pattern="^(HR Interview|Technical Interview)$")


class InterviewAnswer(BaseModel):
    question: str = Field(min_length=3, max_length=500)
    answer: str = Field(default="", max_length=2000)


class InterviewSubmitRequest(BaseModel):
    domain_id: Optional[int] = None
    interview_type: str = Field(pattern="^(HR Interview|Technical Interview)$")
    answers: list[InterviewAnswer] = Field(default_factory=list, max_length=10)


class AIProjectReviewRequest(BaseModel):
    github_link: Optional[str] = Field(default="", max_length=600)
    documentation_link: Optional[str] = Field(default="", max_length=600)
    demo_video_link: Optional[str] = Field(default="", max_length=600)
    readme_text: Optional[str] = Field(default="", max_length=5000)


class CodeAnalysisRequest(BaseModel):
    language: Optional[str] = Field(default="", max_length=80)
    code: str = Field(min_length=1, max_length=12000)


class AIAskRequest(BaseModel):
    tool: str = Field(default="career_counselor", max_length=80)
    message: str = Field(min_length=1, max_length=8000)
    route: Optional[str] = Field(default="/", max_length=300)
    role: Optional[str] = Field(default="guest", max_length=80)


class AIAskResponse(BaseModel):
    answer: str
    provider: str
