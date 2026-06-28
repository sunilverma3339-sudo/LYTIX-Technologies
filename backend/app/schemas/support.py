from typing import Optional

from pydantic import BaseModel, Field


class SupportTicketCreate(BaseModel):
    category: str = Field(min_length=2, max_length=120)
    subject: str = Field(min_length=3, max_length=180)
    description: str = Field(min_length=5, max_length=4000)
    priority: str = Field(default="Medium", pattern="^(Low|Medium|High|Urgent)$")
    attachment_url: Optional[str] = Field(default="", max_length=800)


class SupportTicketUpdate(BaseModel):
    status: Optional[str] = Field(default=None, pattern="^(Open|Assigned|In Progress|Resolved|Closed)$")
    priority: Optional[str] = Field(default=None, pattern="^(Low|Medium|High|Urgent)$")
    assigned_to: Optional[int] = None
    resolution_notes: Optional[str] = Field(default=None, max_length=2000)


class SupportTicketMessageCreate(BaseModel):
    message: str = Field(min_length=1, max_length=3000)
    attachment_url: Optional[str] = Field(default="", max_length=800)

