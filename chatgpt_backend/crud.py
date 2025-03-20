from sqlalchemy.orm import Session
from models import Chat, Message
from schemas import ChatCreate, MessageCreate

def create_chat(db: Session, user_id: int):
    new_chat = Chat(user_id=user_id)
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return new_chat

def get_chats(db: Session, user_id: int):
    return db.query(Chat).filter(Chat.user_id == user_id).all()

def create_message(db: Session, chat_id: int, content: str, response: str):
    new_message = Message(chat_id=chat_id, content=content, response=response)
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message

def get_messages(db: Session, chat_id: int):
    return db.query(Message).filter(Message.chat_id == chat_id).all()
