from fastapi import APIRouter

from app.database import get_connection
from app.routes.common import parse_domain


router = APIRouter(prefix="/domains", tags=["internship domains"])


@router.get("")
def list_domains() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM internship_domains ORDER BY id").fetchall()
    return [parse_domain(dict(row)) for row in rows]
