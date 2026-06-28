import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException, status

from app.auth.jwt import hash_password, verify_password


OTP_EXPIRE_MINUTES = 10
OTP_MAX_ATTEMPTS = 5


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(otp: str) -> str:
    return hash_password(otp)


def verify_otp(otp: str, otp_hash: str | None) -> bool:
    return bool(otp_hash) and verify_password(otp, otp_hash)


def otp_expiry() -> str:
    return (datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)).isoformat()


def is_expired(value: str | None) -> bool:
    if not value:
        return True
    try:
        return datetime.fromisoformat(value) < datetime.utcnow()
    except ValueError:
        return True


def ensure_attempts_available(attempts: int | None, label: str) -> None:
    if int(attempts or 0) >= OTP_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Maximum {label} OTP attempts reached. Please resend OTP to try again.",
        )
