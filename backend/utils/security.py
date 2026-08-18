"""Password hashing (bcrypt) and JWT issue/verify helpers."""
import os
from pathlib import Path

from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db

load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=False)

SECRET_KEY = os.getenv("SECRET_KEY", "rightpolamright-dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: str, extra: dict | None = None) -> str:
    payload = {
        "sub": str(subject),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from models import User

    creds_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session expired. Sign in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise creds_error
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except jwt.PyJWTError:
        raise creds_error
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise creds_error
    return user


def require_roles(*roles):
    """Route guard: only the listed roles may proceed.

    Keeps customer and driver tokens out of admin endpoints.
    """
    def dependency(user=Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account does not have access to this area.",
            )
        return user
    return dependency


require_admin = require_roles("admin")
require_customer = require_roles("customer")
require_driver = require_roles("driver")
