from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class LearningStatus(str, enum.Enum):
    new = "new"
    learning = "learning"
    mastered = "mastered"

class Vocabulary(Base):
    __tablename__ = "vocabularies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    word = Column(String, index=True, nullable=False)
    definition = Column(Text)
    translation = Column(String)
    context_sentence = Column(Text)
    language = Column(String, default="en")

    learning_status = Column(Enum(LearningStatus), default=LearningStatus.new)
    next_review_date = Column(DateTime(timezone=True))
    ease_factor = Column(Float, default=2.5)        # SM-2: starts at 2.5
    repetition_count = Column(Integer, default=0)   # SM-2: consecutive successful reps

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
