from typing import Optional

from pydantic import BaseModel, Field


class DocumentGenerateRequest(BaseModel):
    work_summary: Optional[str] = Field(default="", max_length=1200)
    performance_rating: Optional[str] = Field(default="Excellent", max_length=80)


class DocumentRevokeRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=600)
