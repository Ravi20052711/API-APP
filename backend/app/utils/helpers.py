import secrets
from datetime import datetime


def generate_api_key() -> str:
    return f"mf_{secrets.token_urlsafe(32)}"


def mask_api_key(api_key: str) -> str:
    if len(api_key) <= 8:
        return "*" * len(api_key)
    return api_key[:4] + "*" * (len(api_key) - 8) + api_key[-4:]
