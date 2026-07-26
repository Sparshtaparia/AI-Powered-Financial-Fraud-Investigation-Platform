from aegis.auth.jwt import decode_token
from core.config import settings
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    payload = decode_token(token, settings.jwt_secret)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


def require_roles(*allowed_roles: str):
    def role_checker(user: dict = Depends(get_current_user)):
        user_roles = user.get("roles", [])
        if "admin" in user_roles:
            return user
        for role in allowed_roles:
            if role in user_roles:
                return user
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    return role_checker
