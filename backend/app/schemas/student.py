from typing import Optional

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=160)
    password: str = Field(min_length=8, max_length=128)
    phone: str = Field(min_length=10, max_length=20)
    college: Optional[str] = Field(default=None, max_length=160)
    graduation_year: Optional[str] = Field(default=None, max_length=20)


class LoginRequest(BaseModel):
    email: str
    password: str


class OtpVerifyRequest(BaseModel):
    email: str = Field(min_length=5, max_length=160)
    otp: str = Field(pattern=r"^\d{6}$")


class OtpResendRequest(BaseModel):
    email: str = Field(min_length=5, max_length=160)


class ApplicationRequest(BaseModel):
    domain_id: int
    statement: str = Field(min_length=20, max_length=1200)
    skills: Optional[str] = Field(default="", max_length=600)
    linkedin_url: Optional[str] = Field(default="", max_length=300)


class ChecklistUpdate(BaseModel):
    profile_updated: Optional[bool] = None
    headline_updated: Optional[bool] = None
    post_published: Optional[bool] = None
    tasks_documented: Optional[bool] = None
    certificate_shared: Optional[bool] = None
    internship_experience_added: Optional[bool] = None
    certificate_added: Optional[bool] = None
    project_posted: Optional[bool] = None
    company_page_followed: Optional[bool] = None


class FinalProjectUpdate(BaseModel):
    final_project_url: str = Field(min_length=8, max_length=400)
