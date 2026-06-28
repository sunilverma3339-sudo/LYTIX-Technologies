import os


SMS_PROVIDER = os.getenv("SMS_PROVIDER", "console").strip().lower() or "console"
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "")
MSG91_AUTH_KEY = os.getenv("MSG91_AUTH_KEY", "")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")


def send_mobile_otp(mobile: str, otp: str) -> dict:
    """Queue an OTP through the configured SMS provider.

    The MVP intentionally avoids paid/network SMS calls. Console mode prints the OTP
    for local testing; named providers are validated and logged as placeholders.
    """
    if SMS_PROVIDER == "console":
        print(f"[LYTIX SMS OTP] Mobile: {mobile} | OTP: {otp} | Expires in 10 minutes")
        return {"provider": "console", "status": "printed"}
    if SMS_PROVIDER == "fast2sms":
        _require("FAST2SMS_API_KEY", FAST2SMS_API_KEY)
        print(f"[LYTIX SMS OTP] FAST2SMS placeholder queued for {mobile}")
        return {"provider": "fast2sms", "status": "queued-placeholder"}
    if SMS_PROVIDER == "msg91":
        _require("MSG91_AUTH_KEY", MSG91_AUTH_KEY)
        print(f"[LYTIX SMS OTP] MSG91 placeholder queued for {mobile}")
        return {"provider": "msg91", "status": "queued-placeholder"}
    if SMS_PROVIDER == "twilio":
        _require("TWILIO_ACCOUNT_SID", TWILIO_ACCOUNT_SID)
        _require("TWILIO_AUTH_TOKEN", TWILIO_AUTH_TOKEN)
        _require("TWILIO_PHONE_NUMBER", TWILIO_PHONE_NUMBER)
        print(f"[LYTIX SMS OTP] Twilio placeholder queued for {mobile}")
        return {"provider": "twilio", "status": "queued-placeholder"}
    raise ValueError(f"Unsupported SMS_PROVIDER: {SMS_PROVIDER}")


def _require(name: str, value: str) -> None:
    if not value:
        raise ValueError(f"{name} is required for SMS_PROVIDER={SMS_PROVIDER}")
