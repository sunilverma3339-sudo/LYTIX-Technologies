from typing import Optional

from pydantic import BaseModel, Field


class AdminApplicationUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    test_score: Optional[int] = Field(default=None, ge=0, le=100)
    final_project_url: Optional[str] = Field(default=None, max_length=400)
    linkedin_url: Optional[str] = Field(default=None, max_length=300)


class AdminDecision(BaseModel):
    decision: str = Field(pattern="^(Approved|Rejected)$")
    test_score: Optional[int] = Field(default=None, ge=0, le=100)
    note: Optional[str] = Field(default=None, max_length=500)


class PaymentMark(BaseModel):
    status: str = Field(default="Paid", pattern="^(Paid|Pending|Failed|Refunded)$")


class TaskCreate(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    description: Optional[str] = Field(default="", max_length=800)
    due_date: Optional[str] = Field(default=None, max_length=30)


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=180)
    description: Optional[str] = Field(default=None, max_length=800)
    due_date: Optional[str] = Field(default=None, max_length=30)
    status: Optional[str] = Field(default=None, max_length=40)


class ProjectReview(BaseModel):
    project_status: str = Field(pattern="^(Not Submitted|Submitted|Needs Changes|Reviewed)$")
    note: Optional[str] = Field(default=None, max_length=500)
