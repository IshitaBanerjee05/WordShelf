from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .vocabulary import LearningStatus

class VocabularyBase(BaseModel):
    word: str
    definition: Optional[str] = None
    translation: Optional[str] = None
    context_sentence: Optional[str] = None
    language: Optional[str] = "en"
    learning_status: Optional[LearningStatus] = LearningStatus.new

class VocabularyCreate(VocabularyBase):
    pass

class VocabularyUpdate(BaseModel):
    word: Optional[str] = None
    definition: Optional[str] = None
    translation: Optional[str] = None
    context_sentence: Optional[str] = None
    language: Optional[str] = None
    learning_status: Optional[LearningStatus] = None
    next_review_date: Optional[datetime] = None

class VocabularyResponse(VocabularyBase):
    id: int
    user_id: int
    next_review_date: Optional[datetime] = None
    ease_factor: Optional[float] = 2.5
    repetition_count: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True

class TextExtractRequest(BaseModel):
    text: str
    max_words: Optional[int] = 15

class ReviewRequest(BaseModel):
    # 1 = again, 2 = hard, 3 = good, 4 = easy
    quality: int
