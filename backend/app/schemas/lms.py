from typing import Optional

from pydantic import BaseModel, Field


class LearningMaterialCreate(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    description: Optional[str] = Field(default="", max_length=800)
    domain_id: int
    type: str = Field(pattern="^(video|pdf|article|link)$")
    url: str = Field(min_length=5, max_length=600)
    week_number: int = Field(ge=1, le=52)


class MaterialProgressUpdate(BaseModel):
    status: str = Field(pattern="^(Not Started|In Progress|Completed)$")


class AttendanceMark(BaseModel):
    student_id: int
    date: str = Field(min_length=8, max_length=20)
    status: str = Field(pattern="^(present|absent)$")
    remarks: Optional[str] = Field(default="", max_length=500)


class AssignmentCreate(BaseModel):
    domain_id: int
    title: str = Field(min_length=3, max_length=180)
    description: Optional[str] = Field(default="", max_length=800)
    week_number: int = Field(ge=1, le=52)
    due_date: Optional[str] = Field(default=None, max_length=30)


class AssignmentSubmit(BaseModel):
    submission_link: str = Field(min_length=5, max_length=600)


class AssignmentReview(BaseModel):
    status: str = Field(default="reviewed", pattern="^(submitted|reviewed)$")
    marks: Optional[int] = Field(default=None, ge=0, le=100)
    feedback: Optional[str] = Field(default="", max_length=800)


class QuizOptionCreate(BaseModel):
    option_text: str = Field(min_length=1, max_length=300)
    is_correct: bool = False


class QuizQuestionCreate(BaseModel):
    question_text: str = Field(min_length=3, max_length=600)
    options: list[QuizOptionCreate] = Field(min_length=2, max_length=6)


class QuizCreate(BaseModel):
    domain_id: int
    title: str = Field(min_length=3, max_length=180)
    description: Optional[str] = Field(default="", max_length=800)
    week_number: int = Field(ge=1, le=52)
    questions: list[QuizQuestionCreate] = Field(min_length=1, max_length=30)


class QuizAnswer(BaseModel):
    question_id: int
    option_id: int


class QuizAttempt(BaseModel):
    answers: list[QuizAnswer] = Field(min_length=1)
