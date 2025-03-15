from pydantic import BaseModel

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

