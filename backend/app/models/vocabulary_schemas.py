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
    max_words: Optional[int] = 12

class ExtractedWord(BaseModel):
    word: str
    pos: str
    difficulty_label: str   # "common" | "advanced" | "uncommon" | "rare"
    difficulty_score: float # 0-1, 1=hardest
    definition: Optional[str] = None
    example: Optional[str] = None

class ReviewRequest(BaseModel):
    quality: int  # 1=again, 2=hard, 3=good, 4=easy

class EvaluateRequest(BaseModel):
    word_id: int
    sentence: str

class EvaluateResponse(BaseModel):
    score: int          # 1-10
    correct_usage: bool
    grammar_ok: bool
    word_present: bool
    feedback: str
    suggestion: Optional[str] = None
    quality: int        # SM-2 quality 1-4
    tier: str           # "basic" | "ollama"

class AiStatusResponse(BaseModel):
    tier: str           # "basic" | "ollama"
    model: Optional[str] = None
    available: bool
