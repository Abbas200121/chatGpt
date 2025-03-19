from fastapi.middleware.cors import CORSMiddleware
import models
import schemas
import auth
from database import SessionLocal, engine
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from models import User
from schemas import UserCreate
from passlib.context import CryptContext
from fastapi import FastAPI, Depends
from models import Message
from database import SessionLocal
from auth import get_current_user
from ai_service import get_ai_response
from schemas import UserCreate, UserMessages, MessageRequest, MessageResponse
from typing import List  # ✅ Import List here
models.Base.metadata.create_all(bind=engine)
import crud

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

origins = [
    "http://172.20.10.7:3000",  # Your frontend IP
    "http://localhost:3000"     # Localhost for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # ✅ No "*" wildcard, only specific origins
    allow_credentials=True,  # ✅ Required when using withCredentials in Axios
    allow_methods=["*"],  # ✅ Allow all HTTP methods
    allow_headers=["*"],  # ✅ Allow all headers
)


# ✅ AI API Details (Using Hugging Face)
HF_API_URL = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill"
HF_API_KEY = "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"  # Replace this with your actual Hugging Face API key
# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@app.get("/")
def read_root():
    return {"message": "API is working!"}

@app.post("/message", response_model=MessageResponse)
def send_message(
    message: MessageRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"User: {user}")  # Debugging

    if not isinstance(user, dict) or "id" not in user:
        raise HTTPException(status_code=400, detail="Invalid user authentication")

    # Generate AI Response
    ai_response = get_ai_response(message.content)

    # ✅ Pass user_id separately
    db_message = crud.create_message(db, user["id"], message, ai_response)

    return MessageResponse(id=db_message.id, content=db_message.content, response=db_message.response)
# ✅ Retrieve all previous messages for the logged-in user
@app.get("/messages", response_model=List[MessageResponse])
def get_user_messages(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user or "id" not in user:
        raise HTTPException(status_code=400, detail="Invalid user authentication")

    messages = db.query(Message).filter(Message.user_id == user["id"]).all()
    return messages





@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    # Hash the password
    hashed_password = pwd_context.hash(user.password)

    # ✅ Make sure you use "hashed_password" here!
    new_user = User(email=user.email, hashed_password=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully"}


# ✅ Login API (User Authentication)
@app.post("/login", response_model=schemas.TokenResponse)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = auth.create_access_token({"sub": db_user.email})
    return {"token": token}

# ✅ Protected Route (Example)
@app.get("/protected")
def protected_route(user_email: str = Depends(auth.get_current_user)):
    return {"message": f"Hello, {user_email}, you accessed a protected route!"}

# ✅ Start FastAPI Server
# Run: uvicorn main:app --reload
