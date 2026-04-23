from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone, date as date_type
from typing import List, Dict, Optional

from app.database import get_db
from app.models import bookshelf, vocabulary, user
from app.core.dependencies import get_current_active_user
from pydantic import BaseModel

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)

class AnalyticsResponse(BaseModel):
    total_books: int
    books_completed: int
    total_pages_read: int
    total_vocabulary: int
    mastered_vocabulary: int
    learning_vocabulary: int
    reading_intelligence_score: int

class VocabGrowthPoint(BaseModel):
    name: str
    words: int

class ActivityPoint(BaseModel):
    date: str   # "YYYY-MM-DD"
    count: int

class StreakResponse(BaseModel):
    current_streak: int

@router.get("/", response_model=AnalyticsResponse)
def get_user_analytics(
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    """Computes reading and vocabulary analytics to generate a Reading Intelligence Score."""
    books = db.query(bookshelf.Book).filter(bookshelf.Book.user_id == current_user.id).all()
    total_books = len(books)
    books_completed = sum(1 for b in books if b.status == bookshelf.BookStatus.completed)
    total_pages_read = sum(b.current_page for b in books if b.current_page)

    vocab_items = db.query(vocabulary.Vocabulary).filter(vocabulary.Vocabulary.user_id == current_user.id).all()
    total_vocabulary = len(vocab_items)
    mastered_vocabulary = sum(1 for v in vocab_items if v.learning_status == vocabulary.LearningStatus.mastered)
    learning_vocabulary = sum(1 for v in vocab_items if v.learning_status == vocabulary.LearningStatus.learning)

    score = (total_vocabulary * 2)
    score += (mastered_vocabulary * 5)
    score += (total_books * 10)
    score += (books_completed * 25)
    score += int(total_pages_read * 0.05)

    return AnalyticsResponse(
        total_books=total_books,
        books_completed=books_completed,
        total_pages_read=total_pages_read,
        total_vocabulary=total_vocabulary,
        mastered_vocabulary=mastered_vocabulary,
        learning_vocabulary=learning_vocabulary,
        reading_intelligence_score=score
    )

@router.get("/streak", response_model=StreakResponse)
def get_streak(
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    """
    Returns the user's current consecutive-day learning streak.
    A streak day = any day at least one vocabulary word was added.
    """
    today = datetime.now(timezone.utc).date()

    rows = (
        db.query(
            func.strftime("%Y-%m-%d", vocabulary.Vocabulary.created_at).label("day")
        )
        .filter(vocabulary.Vocabulary.user_id == current_user.id)
        .group_by("day")
        .order_by(func.strftime("%Y-%m-%d", vocabulary.Vocabulary.created_at).desc())
        .all()
    )

    if not rows:
        return StreakResponse(current_streak=0)

    active_dates = {date_type.fromisoformat(r.day) for r in rows}

    streak = 0
    cursor = today
    # Allow streak to not break if the user hasn't added anything yet today
    if cursor not in active_dates:
        cursor -= timedelta(days=1)

    while cursor in active_dates:
        streak += 1
        cursor -= timedelta(days=1)

    return StreakResponse(current_streak=streak)

@router.get("/vocab-growth", response_model=List[VocabGrowthPoint])
def get_vocab_growth(
    period: Optional[str] = Query("week"),
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    """
    Returns vocabulary word counts over time.
      week  → last 7 days  (label: Mon, Tue …)
      month → last 30 days (label: Apr 1, Apr 2 …)
      year  → last 12 months (label: Jan, Feb …)
    """
    today = datetime.now(timezone.utc).date()
    results = []

    if period == "month":
        for i in range(29, -1, -1):
            day = today - timedelta(days=i)
            day_start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
            day_end = day_start + timedelta(days=1)
            count = db.query(vocabulary.Vocabulary).filter(
                vocabulary.Vocabulary.user_id == current_user.id,
                vocabulary.Vocabulary.created_at >= day_start,
                vocabulary.Vocabulary.created_at < day_end,
            ).count()
            results.append(VocabGrowthPoint(name=f"{day.strftime('%b')} {day.day}", words=count))

    elif period == "year":
        for i in range(11, -1, -1):
            month = today.month - i
            year = today.year
            while month <= 0:
                month += 12
                year -= 1
            month_start = datetime(year, month, 1, tzinfo=timezone.utc)
            next_month = month + 1 if month < 12 else 1
            next_year = year if month < 12 else year + 1
            month_end = datetime(next_year, next_month, 1, tzinfo=timezone.utc)
            count = db.query(vocabulary.Vocabulary).filter(
                vocabulary.Vocabulary.user_id == current_user.id,
                vocabulary.Vocabulary.created_at >= month_start,
                vocabulary.Vocabulary.created_at < month_end,
            ).count()
            results.append(VocabGrowthPoint(name=month_start.strftime("%b"), words=count))

    else:  # week (default)
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
            day_end = day_start + timedelta(days=1)
            count = db.query(vocabulary.Vocabulary).filter(
                vocabulary.Vocabulary.user_id == current_user.id,
                vocabulary.Vocabulary.created_at >= day_start,
                vocabulary.Vocabulary.created_at < day_end,
            ).count()
            results.append(VocabGrowthPoint(name=day.strftime("%a"), words=count))

    return results

@router.get("/activity", response_model=List[ActivityPoint])
def get_activity(
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    """Per-day vocabulary activity for the full current year — powers the heatmap."""
    today = datetime.now(timezone.utc).date()
    year_start = date_type(today.year, 1, 1)

    rows = (
        db.query(
            func.strftime("%Y-%m-%d", vocabulary.Vocabulary.created_at).label("day"),
            func.count(vocabulary.Vocabulary.id).label("count"),
        )
        .filter(
            vocabulary.Vocabulary.user_id == current_user.id,
            func.strftime("%Y", vocabulary.Vocabulary.created_at) == str(today.year),
        )
        .group_by("day")
        .all()
    )

    counts: Dict[str, int] = {str(row.day): row.count for row in rows}

    results = []
    cursor = year_start
    while cursor <= today:
        key = cursor.strftime("%Y-%m-%d")
        if key in counts:
            results.append(ActivityPoint(date=key, count=counts[key]))
        cursor += timedelta(days=1)

    return results
