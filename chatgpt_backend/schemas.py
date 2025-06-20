from pydantic import BaseModel
from typing import List  # ✅ Import List here

# ✅ User Signup Schema
class UserCreate(BaseModel):
    email: str
    password: str

# ✅ User Login Schema
class UserLogin(BaseModel):
    email: str
    password: str

# ✅ Token Response Schema
class TokenResponse(BaseModel):
    token: str
from pydantic import BaseModel

class MessageRequest(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: int
    content: str
    response: str
class UserMessages(BaseModel):
    user_id: int
    messages: List[MessageResponse]

class MessageCreate(BaseModel):
    user_id: int
    content: str

class ChatCreate(BaseModel):
    user_id: int

class MessageRequest(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: int
    content: str
    response: str

class ChatResponse(BaseModel):
    id: int
    messages: List[MessageResponse]

class PromptRequest(BaseModel):
    prompt: str

from pydantic import BaseModel
from typing import Optional, Dict

class PromptRequest(BaseModel):
    prompt: str



class ImageUpload(BaseModel):
    image: str

class UserInfoResponse(BaseModel):
    id: int
    email: str
    is_admin: bool

