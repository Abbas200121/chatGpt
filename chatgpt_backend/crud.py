from sqlalchemy.orm import Session
from models import Message
from schemas import MessageCreate
from datetime import datetime
from schemas import MessageRequest

# ✅ Create and store a message
def create_message(db: Session, user_id: int, message: MessageRequest, response: str):
    db_message = Message(user_id=user_id, content=message.content, response=response)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

# ✅ Get all messages for a specific user
def get_messages(db: Session, user_id: int):
    return db.query(Message).filter(Message.user_id == user_id).order_by(Message.timestamp).all()
