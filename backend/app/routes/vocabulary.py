from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.database import get_db
from app.models import vocabulary, vocabulary_schemas, user
from app.core.dependencies import get_current_active_user
from app.services.dictionary import fetch_word_definition

router = APIRouter(
    prefix="/vocabulary",
    tags=["Vocabulary"]
)

@router.post("/", response_model=vocabulary_schemas.VocabularyResponse)
async def create_vocabulary(
    vocab: vocabulary_schemas.VocabularyCreate,
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    vocab_data = vocab.model_dump()

    if not vocab_data.get("definition") and vocab_data.get("word"):
        dict_data = await fetch_word_definition(vocab_data["word"])
        if dict_data:
            vocab_data["definition"] = dict_data["definition"]
            if not vocab_data.get("context_sentence") and dict_data.get("example"):
                vocab_data["context_sentence"] = dict_data["example"]

    db_vocab = vocabulary.Vocabulary(**vocab_data, user_id=current_user.id)
    db.add(db_vocab)
    db.commit()
    db.refresh(db_vocab)
    return db_vocab

@router.get("/", response_model=List[vocabulary_schemas.VocabularyResponse])
def get_vocabularies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    vocabularies = db.query(vocabulary.Vocabulary).filter(
        vocabulary.Vocabulary.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return vocabularies

@router.get("/review/due", response_model=List[vocabulary_schemas.VocabularyResponse])
def get_due_reviews(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    """Fetches vocabulary items that are due for review (next_review_date is null or past)."""
    now = datetime.utcnow()
    due_items = db.query(vocabulary.Vocabulary).filter(
        vocabulary.Vocabulary.user_id == current_user.id,
        (vocabulary.Vocabulary.next_review_date == None) | (vocabulary.Vocabulary.next_review_date <= now)
    ).limit(limit).all()
    return due_items

@router.get("/{vocab_id}", response_model=vocabulary_schemas.VocabularyResponse)
def get_vocabulary(
    vocab_id: int,
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    vocab = db.query(vocabulary.Vocabulary).filter(
        vocabulary.Vocabulary.id == vocab_id,
        vocabulary.Vocabulary.user_id == current_user.id
    ).first()
    if vocab is None:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    return vocab

@router.put("/{vocab_id}", response_model=vocabulary_schemas.VocabularyResponse)
def update_vocabulary(
    vocab_id: int,
    vocab_update: vocabulary_schemas.VocabularyUpdate,
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    db_vocab = db.query(vocabulary.Vocabulary).filter(
        vocabulary.Vocabulary.id == vocab_id,
        vocabulary.Vocabulary.user_id == current_user.id
    ).first()
    if db_vocab is None:
        raise HTTPException(status_code=404, detail="Vocabulary not found")

    update_data = vocab_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_vocab, key, value)

    db.commit()
    db.refresh(db_vocab)
    return db_vocab

@router.delete("/{vocab_id}", response_model=dict)
def delete_vocabulary(
    vocab_id: int,
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    db_vocab = db.query(vocabulary.Vocabulary).filter(
        vocabulary.Vocabulary.id == vocab_id,
        vocabulary.Vocabulary.user_id == current_user.id
    ).first()
    if db_vocab is None:
        raise HTTPException(status_code=404, detail="Vocabulary not found")

    db.delete(db_vocab)
    db.commit()
    return {"message": "Vocabulary deleted successfully"}

from app.services.nlp import extract_vocabulary_from_text

@router.post("/extract-from-text", response_model=List[str])
def extract_vocabulary(
    request: vocabulary_schemas.TextExtractRequest,
    current_user: user.User = Depends(get_current_active_user)
):
    """Extracts informative vocabulary words from raw text using SpaCy NLP."""
    words = extract_vocabulary_from_text(request.text, request.max_words)
    return words

@router.post("/{vocab_id}/review", response_model=vocabulary_schemas.VocabularyResponse)
def submit_review(
    vocab_id: int,
    review: vocabulary_schemas.ReviewRequest,
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    """
    SM-2 spaced repetition review.
    quality: 1=again, 2=hard, 3=good, 4=easy
    """
    db_vocab = db.query(vocabulary.Vocabulary).filter(
        vocabulary.Vocabulary.id == vocab_id,
        vocabulary.Vocabulary.user_id == current_user.id
    ).first()
    if db_vocab is None:
        raise HTTPException(status_code=404, detail="Vocabulary not found")

    now = datetime.utcnow()
    q = review.quality
    ef = db_vocab.ease_factor if db_vocab.ease_factor is not None else 2.5
    reps = db_vocab.repetition_count if db_vocab.repetition_count is not None else 0

    if q < 3:
        # Failed recall — reset streak, review tomorrow
        reps = 0
        interval_days = 1
        db_vocab.learning_status = vocabulary.LearningStatus.learning
    else:
        # Successful recall
        if reps == 0:
            interval_days = 1
        elif reps == 1:
            interval_days = 6
        else:
            # Use previous interval × ease factor
            if db_vocab.next_review_date:
                prev_interval = max(1, (db_vocab.next_review_date.replace(tzinfo=None) - now).days)
            else:
                prev_interval = 6
            interval_days = max(1, round(prev_interval * ef))

        reps += 1

        # SM-2 ease factor update: EF' = EF + (0.1 - (5-q)*(0.08+(5-q)*0.02))
        ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        ef = max(1.3, ef)

        if interval_days >= 21:
            db_vocab.learning_status = vocabulary.LearningStatus.mastered
        else:
            db_vocab.learning_status = vocabulary.LearningStatus.learning

    db_vocab.ease_factor = ef
    db_vocab.repetition_count = reps
    db_vocab.next_review_date = now + timedelta(days=interval_days)

    db.commit()
    db.refresh(db_vocab)
    return db_vocab
