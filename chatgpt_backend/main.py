from fastapi.middleware.cors import CORSMiddleware

import os
import base64
import uuid
import random

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
from auth import get_current_user  
from auth import router as auth_router
from starlette.middleware.sessions import SessionMiddleware

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
HF_API_TOKEN="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"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ✅ Handle Preflight Requests (Manually)
@app.options("/{full_path:path}")
async def preflight_handler():
    return {"message": "CORS preflight request allowed"}
@app.get("/")
def read_root():
    return {"message": "API is working!"}


from fastapi import FastAPI, File, UploadFile, HTTPException

from transformers import BlipProcessor, BlipForConditionalGeneration

processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

from image_service import poll_stablehorde_status
import requests

UPLOAD_FOLDER = "uploaded_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
headers = {"Authorization": f"Bearer {HF_API_KEY}"}

@app.get("/chats/{chat_id}/suggestions")
def get_suggestions(chat_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    # Verify chat ownership (optional if you removed auth)
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Example logic — return 3 random suggestions
    suggestion_pool = [
        "Can you explain more?",
        "Give me an example.",
        "Translate this to Arabic.",
        "Summarize in 3 points.",
        "Continue the last answer.",
        "Show as a table.",
        "Make it more detailed.",
        "What's the opposite?",
        "Give me pros and cons.",
        "Draw it as a diagram."
    ]
    suggestions = random.sample(suggestion_pool, 3)
    return {"suggestions": suggestions}
# ✅ Get all user chats
@app.get("/chats")
def get_user_chats(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    chats = db.query(Chat).filter(Chat.user_id == user["id"]).order_by(Chat.id).all()

    # ✅ Assign sequential numbers per user (1, 2, 3...)
    user_chats = [{"id": chat.id, "number": idx + 1} for idx, chat in enumerate(chats)]

    return {"chats": user_chats}


@app.post("/chats/{chat_id}/upload-image", response_model=schemas.MessageResponse)
def upload_image(
    chat_id: int,
    image: schemas.ImageUpload,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user["id"]).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        # Decode base64 and save
        base64_data = image.image.split(",")[-1]
        image_bytes = base64.b64decode(base64_data)
        filename = f"{uuid.uuid4().hex}.png"
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        with open(image_path, "wb") as f:
            f.write(image_bytes)

        # Send to Hugging Face Inference API
        with open(image_path, "rb") as f:
            response = requests.post(
                "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base",
                headers={
                    "Authorization": f"Bearer YOUR_HUGGINGFACE_API_TOKEN"
                },
                files={"file": f}
            )

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to get description")

        result = response.json()
        caption = result[0]["generated_text"] if result else "No caption returned"

        # Save as a new message (user uploads image, bot replies with caption)
        content_html = f'<img src="/{image_path}" alt="uploaded" class="rounded-lg max-w-full" />'
        db_message = crud.create_message(db, chat_id, content_html, caption)

        return schemas.MessageResponse(
            id=db_message.id,
            content=db_message.content,
            response=db_message.response
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image captioning failed: {str(e)}")
@app.post("/chats/{chat_id}/generate-image", response_model=MessageResponse)
def generate_chat_image(chat_id: int, prompt: schemas.PromptRequest, user: dict = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user["id"]).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    try:
        # Step 1: Submit image request
        generation_response = requests.post(
            "https://stablehorde.net/api/v2/generate/async",
            json={
                "prompt": prompt.prompt,
                "params": {
                    "n": 1,
                    "width": 512,
                    "height": 512
                }
            },
            headers={
                "Content-Type": "application/json",
                "Client-Agent": "chatGpt_backend",
                "apikey": "sh-NkN32fW7bFadpJkJV4A"  # Replace with real key if needed
            }
        )

        if generation_response.status_code != 202:
            raise HTTPException(status_code=500, detail="Failed to submit image generation request")

        request_id = generation_response.json().get("id")
        image_url = poll_stablehorde_status(request_id, api_key="sh-NkN32fW7bFadpJkJV4A")

        if not image_url:
            raise HTTPException(status_code=504, detail="Image generation timed out")

        # Step 2: Save to messages (prompt as content, image as response)
        db_message = crud.create_message(db, chat_id, prompt.prompt, image_url)

        return MessageResponse(id=db_message.id, content=db_message.content, response=db_message.response)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")



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

    token = auth.create_access_token({"sub": new_user.email})
    return {"token": token}


from schemas import UserInfoResponse

@app.get("/me", response_model=UserInfoResponse)
def get_user_info(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"]}


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
