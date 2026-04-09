from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone, date as date_type
from typing import List, Dict

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

@router.get("/", response_model=AnalyticsResponse)
def get_user_analytics(
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    """
    Computes reading and vocabulary analytics to generate a Reading Intelligence Score.
    RI Score starts at 0 and is earned entirely through activity.
    """
    # Books stats
    books = db.query(bookshelf.Book).filter(bookshelf.Book.user_id == current_user.id).all()
    total_books = len(books)
    books_completed = sum(1 for b in books if b.status == bookshelf.BookStatus.completed)
    total_pages_read = sum(b.current_page for b in books if b.current_page)

    # Vocabulary stats
    vocab_items = db.query(vocabulary.Vocabulary).filter(vocabulary.Vocabulary.user_id == current_user.id).all()
    total_vocabulary = len(vocab_items)
    mastered_vocabulary = sum(1 for v in vocab_items if v.learning_status == vocabulary.LearningStatus.mastered)
    learning_vocabulary = sum(1 for v in vocab_items if v.learning_status == vocabulary.LearningStatus.learning)

    # RI Score — starts at 0, earned through real activity
    # Each word added:   +2 pts
    # Each mastered:     +5 bonus pts
    # Each book started: +10 pts
    # Each completed:    +25 bonus pts
    # Pages read:        +0.05 pts/page
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

@router.get("/vocab-growth", response_model=List[VocabGrowthPoint])
def get_vocab_growth(
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    """
    Returns daily vocabulary word counts for the past 7 days,
    to power the vocabulary growth area chart on the dashboard.
    """
    today = datetime.now(timezone.utc).date()
    results = []

    for i in range(6, -1, -1):  # 6 days ago → today
        day = today - timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)

        count = db.query(vocabulary.Vocabulary).filter(
            vocabulary.Vocabulary.user_id == current_user.id,
            vocabulary.Vocabulary.created_at >= day_start,
            vocabulary.Vocabulary.created_at < day_end,
        ).count()

        results.append(VocabGrowthPoint(
            name=day.strftime("%a"),  # "Mon", "Tue", etc.
            words=count
        ))

    return results

@router.get("/activity", response_model=List[ActivityPoint])
def get_activity(
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    """
    Returns per-day vocabulary activity counts for the full current year.
    Used to populate the scrollable calendar heatmap on the Dashboard.
    """
    today = datetime.now(timezone.utc).date()
    year_start = date_type(today.year, 1, 1)

    # Query: count vocab items grouped by their creation date
    # Using strftime for SQLite compatibility (handles timezone-aware datetime strings)
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

    # Build a lookup dict: "YYYY-MM-DD" -> count
    counts: Dict[str, int] = {str(row.day): row.count for row in rows}

    # Generate every day from Jan 1 to today; emit only days with data
    results = []
    cursor = year_start
    while cursor <= today:
        key = cursor.strftime("%Y-%m-%d")
        if key in counts:
            results.append(ActivityPoint(date=key, count=counts[key]))
        cursor += timedelta(days=1)

    return results
