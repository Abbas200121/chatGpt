from sqlalchemy.orm import Session
from models import Message
from schemas import MessageCreate

def create_message(db: Session, message: MessageCreate, response: str):
    db_message = Message(user_id=message.user_id, content=message.content, response=response)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_messages(db: Session, user_id: int):
    return db.query(Message).filter(Message.user_id == user_id).all()
