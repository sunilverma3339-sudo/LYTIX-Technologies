from typing import Optional

from pydantic import BaseModel, Field


FREELANCE_CATEGORY_PATTERN = (
    "^(Web Development|Mobile App Development|AI & Machine Learning|Data Science|"
    "UI/UX Design|Cyber Security|Cloud & DevOps|IoT & Automation|"
    "Digital Marketing|Content Writing)$"
)


class FreelanceProjectCreate(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    category: str = Field(pattern=FREELANCE_CATEGORY_PATTERN)
    description: str = Field(min_length=20, max_length=2000)
    budget: str = Field(min_length=1, max_length=80)
    duration: str = Field(min_length=1, max_length=80)
    skills: str = Field(min_length=2, max_length=400)
    experience_level: str = Field(min_length=2, max_length=80)
    deadline: str = Field(min_length=4, max_length=30)
    client_name: str = Field(min_length=2, max_length=120)
    client_email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=180)
    company_name: Optional[str] = Field(default="", max_length=160)
