from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class BookStatus(str, enum.Enum):
    to_read = "to_read"
    reading = "reading"
    completed = "completed"

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, index=True, nullable=False)
    author = Column(String)
    total_pages = Column(Integer, default=0)
    current_page = Column(Integer, default=0)
    status = Column(Enum(BookStatus), default=BookStatus.to_read)
    language = Column(String, default="en")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
