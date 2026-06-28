from fastapi import FastAPI, Request

from app.database import get_connection, row_to_dict

from .jwt import decode_access_token


def register_auth_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def jwt_auth_middleware(request: Request, call_next):
        request.state.user = None
        header = request.headers.get("Authorization", "")
        if header.startswith("Bearer "):
            payload = decode_access_token(header.removeprefix("Bearer ").strip())
            if payload:
                with get_connection() as conn:
                    request.state.user = row_to_dict(
                        conn.execute(
                            "SELECT * FROM users WHERE id = ?", (payload.get("sub"),)
                        ).fetchone()
                    )
        return await call_next(request)
