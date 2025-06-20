from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Chat, Message
from auth import get_current_user

admin_router = APIRouter()

@admin_router.get("/admin/users", tags=["Admin"])
def get_all_users(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(User).all()

@admin_router.get("/admin/chats/{user_id}", tags=["Admin"])
def get_user_chats(user_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(Chat).filter(Chat.user_id == user_id).all()

@admin_router.get("/admin/messages/{chat_id}", tags=["Admin"])
def get_chat_messages(chat_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(Message).filter(Message.chat_id == chat_id).all()

@admin_router.delete("/admin/messages/{message_id}", tags=["Admin"])
def delete_message(message_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    message = db.query(Message).filter(Message.id == message_id).first()
    if message:
        db.delete(message)
        db.commit()
        return {"detail": "Message deleted"}
    raise HTTPException(status_code=404, detail="Message not found")
