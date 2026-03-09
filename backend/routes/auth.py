"""
Authentication Routes
- POST /api/auth/register  → Create account
- POST /api/auth/login     → Login and get token
- GET  /api/auth/me        → Get my profile
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from database import get_connection

router = APIRouter()

# Password hashing setup
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET = os.getenv("SECRET_KEY", "mysecretkey123")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

security = HTTPBearer()


# ── Request/Response models ────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    company: str = ""
    industry: str = "Services"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── Helper functions ───────────────────────────────────────────────────────────

def make_token(user_id: int) -> str:
    """Create a JWT token that expires in 24 hours."""
    expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency: call this in any protected route.
    Returns the user row from database, or raises 401.
    """
    try:
        payload = jwt.decode(credentials.credentials, SECRET, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid or expired token. Please login again.")

    conn = get_connection()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    return dict(user)


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/register")
def register(data: RegisterRequest):
    """Create a new user account."""
    conn = get_connection()

    # Check if email already used
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (data.email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="This email is already registered.")

    # Save user with hashed password
    cursor = conn.execute(
        "INSERT INTO users (full_name, email, password, company, industry) VALUES (?,?,?,?,?)",
        (data.full_name, data.email, pwd.hash(data.password), data.company, data.industry)
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    return {
        "token": make_token(user_id),
        "user": {"id": user_id, "full_name": data.full_name, "email": data.email, "company": data.company, "industry": data.industry}
    }


@router.post("/login")
def login(data: LoginRequest):
    """Login with email and password."""
    conn = get_connection()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (data.email,)).fetchone()
    conn.close()

    if not user or not pwd.verify(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Wrong email or password.")

    user = dict(user)
    return {
        "token": make_token(user["id"]),
        "user": {"id": user["id"], "full_name": user["full_name"], "email": user["email"],
                 "company": user["company"], "industry": user["industry"]}
    }


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    return {k: current_user[k] for k in ["id", "full_name", "email", "company", "industry"]}
