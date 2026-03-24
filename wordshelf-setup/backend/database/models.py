"""
WordShelf — All Database Models
"""
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean,
    DateTime, Date, ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.db import Base, TimestampMixin
import enum


# ── Enums ─────────────────────────────────────────────────────
class ResourceType(str, enum.Enum):
    book     = "book"
    movie    = "movie"
    article  = "article"
    podcast  = "podcast"
    other    = "other"

class ResourceStatus(str, enum.Enum):
    learning  = "Currently Learning"
    completed = "Completed"
    planned   = "Planned"

class WordLevel(str, enum.Enum):
    beginner     = "Beginner"
    intermediate = "Intermediate"
    advanced     = "Advanced"

class MasteryStatus(str, enum.Enum):
    new       = "New"
    learning  = "Learning"
    reviewing = "Reviewing"
    mastered  = "Mastered"


# ── User ──────────────────────────────────────────────────────
class User(Base, TimestampMixin):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String(100), nullable=False)
    email           = Column(String(255), unique=True, index=True, nullable=False)
    password_hash   = Column(String(255), nullable=False)
    avatar_url      = Column(String(500), nullable=True)
    language_pref   = Column(String(10), default="en")   # ISO code e.g. "en", "fr"
    ris_score       = Column(Float, default=0.0)
    streak_count    = Column(Integer, default=0)
    last_active     = Column(Date, nullable=True)
    is_active       = Column(Boolean, default=True)

    # Relationships
    books      = relationship("Book",        back_populates="user", cascade="all, delete")
    words      = relationship("Word",        back_populates="user", cascade="all, delete")
    flashcards = relationship("Flashcard",   back_populates="user", cascade="all, delete")
    sessions   = relationship("RevSession",  back_populates="user", cascade="all, delete")


# ── Book / Media Resource ─────────────────────────────────────
class Book(Base, TimestampMixin):
    __tablename__ = "books"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title       = Column(String(255), nullable=False)
    author      = Column(String(255), nullable=True)
    type        = Column(Enum(ResourceType), default=ResourceType.book)
    language    = Column(String(10), default="en")
    status      = Column(Enum(ResourceStatus), default=ResourceStatus.planned)
    cover_url   = Column(String(500), nullable=True)
    notes       = Column(Text, nullable=True)
    total_words = Column(Integer, default=0)  # count of linked words

    user  = relationship("User",  back_populates="books")
    words = relationship("Word",  back_populates="source")


# ── Word / Vocabulary Entry ───────────────────────────────────
class Word(Base, TimestampMixin):
    __tablename__ = "words"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"),  nullable=False, index=True)
    source_id       = Column(Integer, ForeignKey("books.id"),  nullable=True,  index=True)
    word            = Column(String(100), nullable=False, index=True)
    phonetic        = Column(String(100), nullable=True)
    definition      = Column(Text, nullable=True)
    translation     = Column(Text, nullable=True)     # JSON: {"fr":"...", "es":"..."}
    example         = Column(Text, nullable=True)
    synonyms        = Column(Text, nullable=True)     # comma-separated
    antonyms        = Column(Text, nullable=True)
    part_of_speech  = Column(String(50), nullable=True)
    level           = Column(Enum(WordLevel), default=WordLevel.intermediate)
    mastery         = Column(Enum(MasteryStatus), default=MasteryStatus.new)
    # SM-2 fields
    ease_factor     = Column(Float, default=2.5)
    interval_days   = Column(Integer, default=1)
    next_review     = Column(Date, nullable=True, index=True)
    review_count    = Column(Integer, default=0)

    user       = relationship("User",      back_populates="words")
    source     = relationship("Book",      back_populates="words")
    flashcards = relationship("Flashcard", back_populates="word", cascade="all, delete")
    rev_logs   = relationship("RevLog",    back_populates="word",  cascade="all, delete")


# ── Flashcard ─────────────────────────────────────────────────
class Flashcard(Base, TimestampMixin):
    __tablename__ = "flashcards"

    id       = Column(Integer, primary_key=True, index=True)
    user_id  = Column(Integer, ForeignKey("users.id"),  nullable=False, index=True)
    word_id  = Column(Integer, ForeignKey("words.id"),  nullable=False, index=True)
    front    = Column(Text, nullable=False)   # word + phonetic
    back     = Column(Text, nullable=False)   # definition + example

    user = relationship("User", back_populates="flashcards")
    word = relationship("Word", back_populates="flashcards")


# ── Revision Log (one entry per review) ───────────────────────
class RevLog(Base):
    __tablename__ = "revision_logs"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"),  nullable=False, index=True)
    word_id     = Column(Integer, ForeignKey("words.id"),  nullable=False, index=True)
    rating      = Column(Integer, nullable=False)   # 1-5 (SM-2 quality)
    reviewed_at = Column(DateTime(timezone=True), server_default=func.now())

    word = relationship("Word", back_populates="rev_logs")


# ── Revision Session (one per day's practice) ─────────────────
class RevSession(Base):
    __tablename__ = "rev_sessions"

    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date           = Column(Date, nullable=False, index=True)
    words_reviewed = Column(Integer, default=0)
    correct        = Column(Integer, default=0)
    accuracy       = Column(Float,   default=0.0)
    duration_mins  = Column(Integer, default=0)

    user = relationship("User", back_populates="sessions")
