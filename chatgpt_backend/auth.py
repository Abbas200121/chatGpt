import os
import requests
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from starlette.middleware.sessions import SessionMiddleware  # ✅ Required for session storage
from starlette.responses import RedirectResponse
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from dotenv import load_dotenv
from authlib.integrations.starlette_client import OAuth
from passlib.context import CryptContext
from fastapi import APIRouter
# ✅ Load environment variables
load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter()

# ✅ JWT & OAuth Config
SECRET_KEY = os.getenv("SECRET_KEY", "123445")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "1079477075043-16thgohvevab1gtgplbt8e3b1sqd955g.apps.googleusercontent.com")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "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")
REDIRECT_URI = "http://localhost:8000/auth/google/callback"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ✅ Google OAuth Setup with Explicit Metadata URL
oauth = OAuth()
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",  # ✅ Fix `jwks_uri` issue
    client_kwargs={"scope": "openid email profile"},
)

def verify_password(plain_password, hashed_password):
    """Verify if the provided password matches the stored hash."""
    return pwd_context.verify(plain_password, hashed_password)
# ✅ Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ✅ JWT Token Creation
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ✅ Google Login Route
@router.get("/auth/google")
async def google_login(request: Request):
    return await oauth.google.authorize_redirect(request, REDIRECT_URI)

@router.get("/auth/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get("userinfo")

    if not user_info:
        raise HTTPException(status_code=400, detail="Google authentication failed")

    email = user_info["email"]
    existing_user = db.query(User).filter(User.email == email).first()

    if not existing_user:
        new_user = User(email=email, hashed_password="")
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user_id = new_user.id
    else:
        user_id = existing_user.id

    access_token = create_access_token({"sub": email})
    print("Generated Token:", access_token)  # ✅ Debugging output
    return RedirectResponse(url=f"http://localhost:3000/login?token={access_token}")


# ✅ Get Current User from Tokeny
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {"id": user.id, "email": user.email, "is_admin": user.is_admin}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
