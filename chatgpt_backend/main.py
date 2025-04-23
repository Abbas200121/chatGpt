from fastapi.middleware.cors import CORSMiddleware
import models
import schemas
import auth
from database import SessionLocal, engine
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from models import User, Chat, Message
from schemas import UserCreate, MessageRequest, MessageResponse
from passlib.context import CryptContext
from ai_service import get_ai_response
import crud
from typing import List
from auth import get_current_user  # ✅ Fix: Import the missing function
from auth import router as auth_router
from auth import verify_password
from fastapi.responses import FileResponse
from image_service import generate_image
from starlette.middleware.sessions import SessionMiddleware
from image_service import poll_stablehorde_status
import requests

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Change this to match your frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers (Authorization, Content-Type, etc.)
)

# ✅ Session Middleware (Manages user sessions)
app.add_middleware(SessionMiddleware, secret_key="123445")  # Keep secret_key secure!

app.include_router(auth_router)

models.Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


origins = [
    "http://172.20.10.7:3000",  # Your frontend IP
    "http://localhost:3000"  # Localhost for development
]


# ✅ AI API Details
HF_API_URL = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill"
HF_API_KEY = "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"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ✅ Handle Preflight Requests (Manually)
@app.options("/{full_path:path}")
async def preflight_handler():
    return {"message": "CORS preflight request allowed"}
@app.get("/")
def read_root():
    return {"message": "API is working!"}


# ✅ Get all user chats
@app.get("/chats")
def get_user_chats(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    chats = db.query(Chat).filter(Chat.user_id == user["id"]).order_by(Chat.id).all()

    # ✅ Assign sequential numbers per user (1, 2, 3...)
    user_chats = [{"id": chat.id, "number": idx + 1} for idx, chat in enumerate(chats)]

    return {"chats": user_chats}

from image_service import poll_stablehorde_status



@app.post("/generate-image")
def generate_image_endpoint(request: schemas.PromptRequest):
    try:
        # Step 1: Send async request to Stable Horde
        generation_response = requests.post(
            "https://stablehorde.net/api/v2/generate/async",
            json=request.dict(),
            headers={
                "Content-Type": "application/json",
                "Client-Agent": "chatGpt_backend",
                "apikey": "0000000000"  # Optional, works anonymously but slower
            }
        )

        if generation_response.status_code != 200:
            return {"error": "Failed to submit generation request"}

        request_id = generation_response.json().get("id")
        print("📨 Generation ID:", request_id)

        # Step 2: Poll for result
        image_url = poll_stablehorde_status(request_id, api_key="0000000000")

        if image_url:
            return {"image_url": image_url}
        else:
            return {"error": "Image generation failed or timed out"}

    except Exception as e:
        print(f"❌ Exception: {e}")
        return {"error": "Server error occurred"}



# ✅ Create a new chat
@app.post("/chats/new")
def create_new_chat(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    chat = crud.create_chat(db, user["id"])
    return {"chat_id": chat.id, "message": "New chat created"}


# ✅ Get messages from a specific chat
@app.get("/chats/{chat_id}/messages", response_model=List[MessageResponse])
def get_chat_messages(chat_id: int, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user["id"]).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    messages = crud.get_messages(db, chat_id)
    return messages


# ✅ Send a message in a specific chat
@app.post("/chats/{chat_id}/send", response_model=MessageResponse)
def send_chat_message(chat_id: int, message: MessageRequest, user: dict = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user["id"]).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    ai_response = get_ai_response(message.content)
    db_message = crud.create_message(db, chat_id, message.content, ai_response)

    return MessageResponse(id=db_message.id, content=db_message.content, response=db_message.response)


# ✅ User Signup
@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_password = pwd_context.hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully"}


# ✅ User Login
@app.post("/login", response_model=schemas.TokenResponse)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = auth.create_access_token({"sub": db_user.email})
    return {"token": token}


# ✅ Protected Route Example
@app.get("/protected")
def protected_route(user_email: str = Depends(auth.get_current_user)):
    return {"message": f"Hello, {user_email}, you accessed a protected route!"}
