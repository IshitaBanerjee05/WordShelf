from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .bookshelf import BookStatus

class BookBase(BaseModel):
    title: str
    author: Optional[str] = None
    total_pages: Optional[int] = 0
    current_page: Optional[int] = 0
    status: Optional[BookStatus] = BookStatus.to_read
    language: Optional[str] = "en"
    cover_url: Optional[str] = None

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    total_pages: Optional[int] = None
    current_page: Optional[int] = None
    status: Optional[BookStatus] = None
    language: Optional[str] = None
    cover_url: Optional[str] = None

class BookResponse(BookBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
