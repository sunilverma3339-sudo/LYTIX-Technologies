import re

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token, hash_password, verify_password
from app.database import get_connection, row_to_dict
from app.routes.common import public_user
from app.schemas import LoginRequest, OtpResendRequest, OtpVerifyRequest, RegisterRequest
from app.utils.email import log_email_event
from app.utils.otp import (
    OTP_EXPIRE_MINUTES,
    ensure_attempts_available,
    generate_otp,
    hash_otp,
    is_expired,
    otp_expiry,
    verify_otp,
)
from app.utils.sms import send_mobile_otp


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest) -> dict:
    normalized_email = _normalize_email(payload.email)
    normalized_mobile = _normalize_indian_mobile(payload.phone)
    if "@" not in normalized_email:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Valid email required")
    email_otp = generate_otp()
    mobile_otp = generate_otp()
    with get_connection() as conn:
        exists = conn.execute("SELECT id FROM users WHERE email = ?", (normalized_email,)).fetchone()
        if exists:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        mobile_exists = conn.execute("SELECT id FROM users WHERE phone = ?", (normalized_mobile,)).fetchone()
        if mobile_exists:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Mobile number already registered")
        cursor = conn.execute(
            """
            INSERT INTO users
                (name, email, phone, college, graduation_year, password_hash, role,
                 is_email_verified, email_otp_hash, email_otp_expires_at, email_otp_attempts,
                 is_mobile_verified, mobile_otp_hash, mobile_otp_expires_at, mobile_otp_attempts)
            VALUES (?, ?, ?, ?, ?, ?, 'student', 0, ?, ?, 0, 0, ?, ?, 0)
            """,
            (
                payload.name.strip(),
                normalized_email,
                normalized_mobile,
                payload.college,
                payload.graduation_year,
                hash_password(payload.password),
                hash_otp(email_otp),
                otp_expiry(),
                hash_otp(mobile_otp),
                otp_expiry(),
            ),
        )
        user = row_to_dict(conn.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone())
        log_email_event(
            conn,
            email_type="registration_confirmation",
            recipient_email=user["email"],
            subject="Welcome to LYTIX TECHNOLOGIES",
            user_id=user["id"],
            metadata={"workflow": "registration", "verification_required": ["email", "mobile"]},
        )
        _send_email_otp(conn, user, email_otp)
        _send_sms_otp(user["phone"], mobile_otp)
    return _verification_response(user, "Registration successful. Verify your email and mobile OTP to activate your account.")


@router.post("/verify-email-otp")
def verify_email_otp(payload: OtpVerifyRequest) -> dict:
    with get_connection() as conn:
        user = _get_user_by_email(conn, payload.email)
        if _is_true(user.get("is_email_verified")):
            return _verification_response(user, "Email already verified.")
        ensure_attempts_available(user.get("email_otp_attempts"), "email")
        if is_expired(user.get("email_otp_expires_at")):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email OTP expired. Please resend OTP.")
        if not verify_otp(payload.otp, user.get("email_otp_hash")):
            attempts = int(user.get("email_otp_attempts") or 0) + 1
            conn.execute("UPDATE users SET email_otp_attempts = ? WHERE id = ?", (attempts, user["id"]))
            ensure_attempts_available(attempts, "email")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email OTP")
        conn.execute(
            """
            UPDATE users
            SET is_email_verified = 1,
                email_otp_hash = NULL,
                email_otp_expires_at = NULL,
                email_otp_attempts = 0
            WHERE id = ?
            """,
            (user["id"],),
        )
        user = _get_user_by_email(conn, payload.email)
    return _verification_response(user, "Email OTP verified successfully.")


@router.post("/resend-email-otp")
def resend_email_otp(payload: OtpResendRequest) -> dict:
    email_otp = generate_otp()
    with get_connection() as conn:
        user = _get_user_by_email(conn, payload.email)
        if _is_true(user.get("is_email_verified")):
            return _verification_response(user, "Email already verified.")
        conn.execute(
            """
            UPDATE users
            SET email_otp_hash = ?,
                email_otp_expires_at = ?,
                email_otp_attempts = 0
            WHERE id = ?
            """,
            (hash_otp(email_otp), otp_expiry(), user["id"]),
        )
        user = _get_user_by_email(conn, payload.email)
        _send_email_otp(conn, user, email_otp)
    return _verification_response(user, "Email OTP resent successfully.")


@router.post("/verify-mobile-otp")
def verify_mobile_otp(payload: OtpVerifyRequest) -> dict:
    with get_connection() as conn:
        user = _get_user_by_email(conn, payload.email)
        if _is_true(user.get("is_mobile_verified")):
            return _verification_response(user, "Mobile already verified.")
        ensure_attempts_available(user.get("mobile_otp_attempts"), "mobile")
        if is_expired(user.get("mobile_otp_expires_at")):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mobile OTP expired. Please resend OTP.")
        if not verify_otp(payload.otp, user.get("mobile_otp_hash")):
            attempts = int(user.get("mobile_otp_attempts") or 0) + 1
            conn.execute("UPDATE users SET mobile_otp_attempts = ? WHERE id = ?", (attempts, user["id"]))
            ensure_attempts_available(attempts, "mobile")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid mobile OTP")
        conn.execute(
            """
            UPDATE users
            SET is_mobile_verified = 1,
                mobile_otp_hash = NULL,
                mobile_otp_expires_at = NULL,
                mobile_otp_attempts = 0
            WHERE id = ?
            """,
            (user["id"],),
        )
        user = _get_user_by_email(conn, payload.email)
    return _verification_response(user, "Mobile OTP verified successfully.")


@router.post("/resend-mobile-otp")
def resend_mobile_otp(payload: OtpResendRequest) -> dict:
    mobile_otp = generate_otp()
    with get_connection() as conn:
        user = _get_user_by_email(conn, payload.email)
        if _is_true(user.get("is_mobile_verified")):
            return _verification_response(user, "Mobile already verified.")
        conn.execute(
            """
            UPDATE users
            SET mobile_otp_hash = ?,
                mobile_otp_expires_at = ?,
                mobile_otp_attempts = 0
            WHERE id = ?
            """,
            (hash_otp(mobile_otp), otp_expiry(), user["id"]),
        )
        user = _get_user_by_email(conn, payload.email)
        _send_sms_otp(user["phone"], mobile_otp)
    return _verification_response(user, "Mobile OTP resent successfully.")


@router.post("/login")
def login(payload: LoginRequest) -> dict:
    with get_connection() as conn:
        user = row_to_dict(
            conn.execute(
                "SELECT * FROM users WHERE email = ?", (_normalize_email(payload.email),)
            ).fetchone()
        )
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not _is_true(user.get("is_email_verified")) or not _is_true(user.get("is_mobile_verified")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email and mobile number before login.",
        )
    token = create_access_token(str(user["id"]), user["role"])
    return {"token": token, "user": public_user(user)}


@router.get("/me")
def me(user: dict = Depends(get_current_user)) -> dict:
    return public_user(user)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _normalize_indian_mobile(phone: str) -> str:
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if not re.fullmatch(r"[6-9]\d{9}", digits):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Enter a valid Indian mobile number.",
        )
    return f"+91{digits}"


def _get_user_by_email(conn, email: str) -> dict:
    user = row_to_dict(conn.execute("SELECT * FROM users WHERE email = ?", (_normalize_email(email),)).fetchone())
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def _verification_response(user: dict, message: str) -> dict:
    return {
        "message": message,
        "email": user["email"],
        "mobile": _mask_mobile(user.get("phone") or ""),
        "is_email_verified": _is_true(user.get("is_email_verified")),
        "is_mobile_verified": _is_true(user.get("is_mobile_verified")),
        "otp_expires_in_minutes": OTP_EXPIRE_MINUTES,
    }


def _send_email_otp(conn, user: dict, otp: str) -> None:
    print(f"[LYTIX EMAIL OTP] Email: {user['email']} | OTP: {otp} | Expires in {OTP_EXPIRE_MINUTES} minutes")
    log_email_event(
        conn,
        email_type="account_verification",
        recipient_email=user["email"],
        subject="Verify your LYTIX account email",
        user_id=user["id"],
        metadata={"workflow": "email_otp", "expires_in_minutes": OTP_EXPIRE_MINUTES},
    )


def _send_sms_otp(mobile: str, otp: str) -> None:
    try:
        send_mobile_otp(mobile, otp)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc


def _mask_mobile(mobile: str) -> str:
    digits = re.sub(r"\D", "", mobile)
    if len(digits) >= 10:
        return f"+91 ******{digits[-4:]}"
    return "Mobile on file"


def _is_true(value) -> bool:
    return bool(int(value or 0))
