import json
from typing import Any


def log_email_event(
    conn,
    *,
    email_type: str,
    recipient_email: str,
    subject: str,
    user_id: int | None = None,
    application_id: int | None = None,
    status: str = "Queued",
    metadata: dict[str, Any] | None = None,
) -> None:
    """Store an email automation event. SMTP delivery is intentionally deferred for MVP."""
    conn.execute(
        """
        INSERT INTO email_logs
            (user_id, application_id, email_type, recipient_email, subject, status, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            application_id,
            email_type,
            recipient_email,
            subject,
            status,
            json.dumps(metadata or {}),
        ),
    )

