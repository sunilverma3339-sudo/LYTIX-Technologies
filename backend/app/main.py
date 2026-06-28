import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.middleware import register_auth_middleware
from app.database import init_db
from app.routes import ai, admin, auth, documents, domains, enterprise, freelance, lms, placement, projects, student, support, verification


APP_NAME = os.getenv("APP_NAME", "LYTIX TECHNOLOGIES")


def create_app() -> FastAPI:
    app = FastAPI(title=f"{APP_NAME} API", version="0.2.0")
    _add_cors(app)
    register_auth_middleware(app)
    _include_routes(app)

    @app.on_event("startup")
    def startup() -> None:
        init_db()

    @app.get("/api/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok", "service": APP_NAME}

    return app


def _include_routes(app: FastAPI) -> None:
    app.include_router(auth.router, prefix="/api")
    app.include_router(ai.router, prefix="/api")
    app.include_router(domains.router, prefix="/api")
    app.include_router(enterprise.router, prefix="/api")
    app.include_router(freelance.router, prefix="/api")
    app.include_router(student.router, prefix="/api")
    app.include_router(admin.router, prefix="/api")
    app.include_router(documents.router, prefix="/api")
    app.include_router(lms.router, prefix="/api")
    app.include_router(placement.router, prefix="/api")
    app.include_router(projects.router, prefix="/api")
    app.include_router(support.router, prefix="/api")
    app.include_router(verification.router, prefix="/api")


def _add_cors(app: FastAPI) -> None:
    origins = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]
    if "CORS_ORIGINS" not in os.environ:
        origins.extend(
            [
                "http://127.0.0.1:5173",
                "http://localhost:4173",
                "http://127.0.0.1:4173",
            ]
        )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins or ["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


app = create_app()
