from fastapi.middleware.cors import CORSMiddleware

import os
import base64
import uuid
import random
import zipfile
import io
from fastapi.responses import StreamingResponse
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


from admin_routes import admin_router
app.include_router(admin_router)
# ✅ Handle Preflight Requests (Manually)


@app.get("/admin/users")
def admin_get_users(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    if not user["is_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return crud.get_all_users(db)

@app.get("/admin/users/{user_id}/chats")
def admin_get_chats(user_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    if not user["is_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return crud.get_user_chats(db, user_id)

@app.get("/admin/chats/{chat_id}/messages")
def admin_get_messages(chat_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    if not user["is_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return crud.get_chat_messages(db, chat_id)

@app.delete("/admin/messages/{message_id}")
def admin_delete_message(message_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    if not user["is_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    success = crud.delete_message(db, message_id)
    if success:
        return {"detail": "Message deleted"}
    raise HTTPException(status_code=404, detail="Message not found")

@app.get("/chats/export-zip", response_class=StreamingResponse)
def export_chats_zip(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_chats = db.query(Chat).filter(Chat.user_id == user["id"]).all()
    if not user_chats:
        raise HTTPException(status_code=404, detail="No chats found")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for chat in user_chats:
            messages = db.query(Message).filter(Message.chat_id == chat.id).all()
            content = ""
            for msg in messages:
                content += f"🧑 {msg.content}\n🤖 {msg.response}\n\n"
            zip_file.writestr(f"chat_{chat.id}.txt", content)

    zip_buffer.seek(0)
    return StreamingResponse(zip_buffer, media_type="application/x-zip-compressed", headers={"Content-Disposition": "attachment; filename=chats.zip"})

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


@app.post("/chats/{chat_id}/upload-image")
def upload_image(chat_id: int, image: dict, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Optional: Save image if needed. Right now we just simulate the AI response.
    fixed_description = (
        "The image displays a vibrant and colorful assortment of fresh fruits arranged together on a white background. "
        "At the center stands a tall pineapple with its spiky green crown, surrounded by a variety of fruits that include "
        "a bunch of ripe yellow bananas, shiny red and green apples, clusters of red and green grapes, a juicy orange, "
        "a bright lemon, a soft kiwi, and a mango. The rich colors and natural textures of the fruits create an appealing "
        "and healthy display, emphasizing freshness and variety. This arrangement could be ideal for a fruit platter, a "
        "decorative centerpiece, or simply as a symbol of nutritious eating."
    )

    # Save message (image prompt + AI description)
    new_message = Message(
        chat_id=chat_id,
        content="[Image uploaded]",  # You can include metadata here if needed
        response=fixed_description
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return {"message": "Image processed and fixed response saved."}


@app.get("/admin/users")
def get_all_users(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    return db.query(User).all()

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
    return {"id": user["id"], "email": user["email"], "is_admin": user["is_admin"]}


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
