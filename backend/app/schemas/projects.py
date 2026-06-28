from typing import Optional

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    description: Optional[str] = Field(default="", max_length=1000)
    domain_id: int
    difficulty: str = Field(pattern="^(beginner|intermediate|advanced)$")
    deadline: Optional[str] = Field(default=None, max_length=30)
    requirements: Optional[str] = Field(default="", max_length=1200)
    max_marks: int = Field(default=100, ge=1, le=1000)


class ProjectSubmissionCreate(BaseModel):
    project_id: int
    github_link: str = Field(min_length=5, max_length=600)
    documentation_link: Optional[str] = Field(default="", max_length=600)
    ppt_link: Optional[str] = Field(default="", max_length=600)
    demo_video_link: Optional[str] = Field(default="", max_length=600)


class ProjectReviewRequest(BaseModel):
    status: str = Field(pattern="^(submitted|reviewed|approved|needs improvement)$")
    marks: Optional[int] = Field(default=None, ge=0, le=1000)
    feedback: Optional[str] = Field(default="", max_length=1000)
