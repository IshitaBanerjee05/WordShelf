from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

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
    
    # Auto-fetch definition if not provided
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
    vocabularies = db.query(vocabulary.Vocabulary).filter(vocabulary.Vocabulary.user_id == current_user.id).offset(skip).limit(limit).all()
    return vocabularies

@router.get("/{vocab_id}", response_model=vocabulary_schemas.VocabularyResponse)
def get_vocabulary(
    vocab_id: int, 
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    vocab = db.query(vocabulary.Vocabulary).filter(vocabulary.Vocabulary.id == vocab_id, vocabulary.Vocabulary.user_id == current_user.id).first()
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
    db_vocab = db.query(vocabulary.Vocabulary).filter(vocabulary.Vocabulary.id == vocab_id, vocabulary.Vocabulary.user_id == current_user.id).first()
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
    db_vocab = db.query(vocabulary.Vocabulary).filter(vocabulary.Vocabulary.id == vocab_id, vocabulary.Vocabulary.user_id == current_user.id).first()
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
    """
    Extracts informative vocabulary words from raw text using SpaCy NLP.
    Returns a list of suggested base lemmas.
    """
    words = extract_vocabulary_from_text(request.text, request.max_words)
    return words
from datetime import datetime, timedelta

@router.get("/review/due", response_model=List[vocabulary_schemas.VocabularyResponse])
def get_due_reviews(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    """
    Fetches vocabulary items that are due for review.
    """
    now = datetime.utcnow()
    # Items where next_review_date is null OR past due
    due_items = db.query(vocabulary.Vocabulary).filter(
        vocabulary.Vocabulary.user_id == current_user.id,
        (vocabulary.Vocabulary.next_review_date == None) | (vocabulary.Vocabulary.next_review_date <= now)
    ).limit(limit).all()
    
    return due_items

@router.post("/{vocab_id}/review", response_model=vocabulary_schemas.VocabularyResponse)
def submit_review(
    vocab_id: int,
    review: vocabulary_schemas.ReviewRequest,
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    """
    Submit a review for a flashcard and schedule the next review.
    Simple Spaced Repetition logic.
    quality: 1 = again, 2 = hard, 3 = good, 4 = easy
    """
    db_vocab = db.query(vocabulary.Vocabulary).filter(
        vocabulary.Vocabulary.id == vocab_id, 
        vocabulary.Vocabulary.user_id == current_user.id
    ).first()
    
    if db_vocab is None:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
        
    now = datetime.utcnow()
    
    # Very basic interval calculation
    # If a word is new or missed, review tomorrow
    # If good, review in 3 days. If easy, review in 7 days.
    if review.quality <= 2:
        interval_days = 1
        db_vocab.learning_status = vocabulary.LearningStatus.learning
    elif review.quality == 3:
        interval_days = 3
        db_vocab.learning_status = vocabulary.LearningStatus.learning
    else:
        interval_days = 7
        db_vocab.learning_status = vocabulary.LearningStatus.mastered
        
    db_vocab.next_review_date = now + timedelta(days=interval_days)
    
    db.commit()
    db.refresh(db_vocab)
    return db_vocab
