from jose import jwt, JWTError
from typing import List, Optional

def create_token(sub: str, roles: List[str], secret: str, expires_delta_sec: int = 3600) -> str:
    import time
    now = int(time.time())
    payload = {
        "sub": sub,
        "roles": roles,
        "iat": now,
        "exp": now + expires_delta_sec,
        "iss": "aegis-auth"
    }
    return jwt.encode(payload, secret, algorithm="HS256")

def decode_token(token: str, secret: str) -> Optional[dict]:
    try:
        return jwt.decode(token, secret, algorithms=["HS256"], issuer="aegis-auth")
    except JWTError:
        return None
