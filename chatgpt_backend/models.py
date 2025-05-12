from sqlalchemy import Column, Integer, String, ForeignKey, DateTime ,Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)  # ✅ Fix: Set length (255)
    hashed_password = Column(String(255), nullable=False)  # ✅ Fix: Set length (255)

    chats = relationship("Chat", back_populates="user")

class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chats")
    messages = relationship("Message", back_populates="chat")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)  # ✅ Fix: Add chat_id
    content = Column(Text, nullable=False)  # ✅ Fix: Set length (1000)
    response = Column(Text, nullable=False)  # ✅ Fix: Set length (1000)

    chat = relationship("Chat", back_populates="messages")  # ✅ Fix: Establish relationship
