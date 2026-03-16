from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

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

@router.get("/", response_model=AnalyticsResponse)
def get_user_analytics(
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    """
    Computes reading and vocabulary analytics to generate a Reading Intelligence Score.
    """
    
    # Books stats
    books = db.query(bookshelf.Book).filter(bookshelf.Book.user_id == current_user.id).all()
    total_books = len(books)
    books_completed = sum(1 for b in books if b.status == bookshelf.BookStatus.completed)
    total_pages_read = sum(b.current_page for b in books)
    
    # Vocabulary stats
    vocab_items = db.query(vocabulary.Vocabulary).filter(vocabulary.Vocabulary.user_id == current_user.id).all()
    total_vocabulary = len(vocab_items)
    mastered_vocabulary = sum(1 for v in vocab_items if v.learning_status == vocabulary.LearningStatus.mastered)
    learning_vocabulary = sum(1 for v in vocab_items if v.learning_status == vocabulary.LearningStatus.learning)
    
    # Calculate synthetic Reading Intelligence Score
    # Baseline 100 + bonuses for reading and vocabulary
    score = 100
    score += (books_completed * 50)
    score += int(total_pages_read * 0.1)
    score += (mastered_vocabulary * 5)
    score += (learning_vocabulary * 1)
    
    return AnalyticsResponse(
        total_books=total_books,
        books_completed=books_completed,
        total_pages_read=total_pages_read,
        total_vocabulary=total_vocabulary,
        mastered_vocabulary=mastered_vocabulary,
        learning_vocabulary=learning_vocabulary,
        reading_intelligence_score=score
    )
