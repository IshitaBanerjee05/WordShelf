from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.database import get_db
from app.models import vocabulary, vocabulary_schemas, user
from app.core.dependencies import get_current_active_user
from app.services.dictionary import fetch_word_definition
from app.services.nlp import extract_vocabulary_from_text
from app.services.evaluator import evaluate_usage

router = APIRouter(
    prefix="/vocabulary",
    tags=["Vocabulary"]
)

# ── AI Status ─────────────────────────────────────────────────────────────────

@router.get("/ai-status", response_model=vocabulary_schemas.AiStatusResponse)
def get_ai_status():
    """
    Returns which AI tier is active.
    Tier 1 (basic/spaCy) is always available.
    Tier 2 (ollama) stub is reserved for future integration.
    """
    # Future Tier 2: check if Ollama is reachable at http://localhost:11434
    # For now, always return basic.
    return vocabulary_schemas.AiStatusResponse(
        tier="basic",
        model=None,
        available=True,
    )

# ── CRUD ──────────────────────────────────────────────────────────────────────

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
    return db.query(vocabulary.Vocabulary).filter(
        vocabulary.Vocabulary.user_id == current_user.id
    ).offset(skip).limit(limit).all()

@router.get("/review/due", response_model=List[vocabulary_schemas.VocabularyResponse])
def get_due_reviews(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    now = datetime.utcnow()
    return db.query(vocabulary.Vocabulary).filter(
        vocabulary.Vocabulary.user_id == current_user.id,
        (vocabulary.Vocabulary.next_review_date == None) | (vocabulary.Vocabulary.next_review_date <= now)
    ).limit(limit).all()

@router.get("/{vocab_id}", response_model=vocabulary_schemas.VocabularyResponse)
def get_vocabulary(
    vocab_id: int,
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    v = db.query(vocabulary.Vocabulary).filter(
        vocabulary.Vocabulary.id == vocab_id,
        vocabulary.Vocabulary.user_id == current_user.id
    ).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    return v

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
    if not db_vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    for key, value in vocab_update.model_dump(exclude_unset=True).items():
        setattr(db_vocab, key, value)
    db.commit()
    db.refresh(db_vocab)
    return db_vocab

@router.delete("/{vocab_id}")
def delete_vocabulary(
    vocab_id: int,
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    db_vocab = db.query(vocabulary.Vocabulary).filter(
        vocabulary.Vocabulary.id == vocab_id,
        vocabulary.Vocabulary.user_id == current_user.id
    ).first()
    if not db_vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    db.delete(db_vocab)
    db.commit()
    return {"message": "Vocabulary deleted successfully"}

# ── AI: Extract ───────────────────────────────────────────────────────────────

@router.post("/extract-from-text", response_model=List[vocabulary_schemas.ExtractedWord])
async def extract_vocabulary_endpoint(
    request: vocabulary_schemas.TextExtractRequest,
    current_user: user.User = Depends(get_current_active_user)
):
    """
    Extracts the hardest/most-literary words from a text passage.
    Returns enriched word objects with difficulty scores.
    Tier 1: spaCy + wordfreq.
    Tier 2 hook: replace extract_vocabulary_from_text() call with Ollama in future.
    """
    raw_words = extract_vocabulary_from_text(request.text, request.max_words)

    results: list[vocabulary_schemas.ExtractedWord] = []
    for w in raw_words:
        # Try to fetch a definition for each extracted word
        definition = None
        example = None
        try:
            dict_data = await fetch_word_definition(w["word"])
            if dict_data:
                definition = dict_data.get("definition")
                example = dict_data.get("example")
        except Exception:
            pass

        results.append(vocabulary_schemas.ExtractedWord(
            word=w["word"],
            pos=w.get("pos", "unknown"),
            difficulty_label=w["difficulty_label"],
            difficulty_score=w["difficulty_score"],
            definition=definition,
            example=example,
        ))

    return results

# ── AI: Evaluate Usage ────────────────────────────────────────────────────────

@router.post("/evaluate-usage", response_model=vocabulary_schemas.EvaluateResponse)
def evaluate_usage_endpoint(
    request: vocabulary_schemas.EvaluateRequest,
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    """
    Evaluates a practice sentence using Tier 1 (spaCy rule-based).
    Automatically submits an SM-2 review for the word based on the evaluation score.
    Tier 2 hook: replace evaluate_usage() call with Ollama evaluator in future.
    """
    # Look up the word
    db_vocab = db.query(vocabulary.Vocabulary).filter(
        vocabulary.Vocabulary.id == request.word_id,
        vocabulary.Vocabulary.user_id == current_user.id
    ).first()
    if not db_vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")

    result = evaluate_usage(
        word=db_vocab.word,
        sentence=request.sentence,
        definition=db_vocab.definition or "",
        pos="",  # POS not stored; evaluator handles "unknown" gracefully
    )

    # ── Hook into SM-2 spaced repetition ─────────────────────────────────────
    quality = result["quality"]
    now = datetime.utcnow()
    ef = db_vocab.ease_factor if db_vocab.ease_factor is not None else 2.5
    reps = db_vocab.repetition_count if db_vocab.repetition_count is not None else 0

    if quality < 3:
        reps = 0
        interval_days = 1
        db_vocab.learning_status = vocabulary.LearningStatus.learning
    else:
        if reps == 0:
            interval_days = 1
        elif reps == 1:
            interval_days = 6
        else:
            if db_vocab.next_review_date:
                prev_interval = max(1, (db_vocab.next_review_date.replace(tzinfo=None) - now).days)
            else:
                prev_interval = 6
            interval_days = max(1, round(prev_interval * ef))
        reps += 1
        ef = max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
        db_vocab.learning_status = (
            vocabulary.LearningStatus.mastered if interval_days >= 21
            else vocabulary.LearningStatus.learning
        )

    db_vocab.ease_factor = ef
    db_vocab.repetition_count = reps
    db_vocab.next_review_date = now + timedelta(days=interval_days)
    db.commit()

    return vocabulary_schemas.EvaluateResponse(**result)

# ── Spaced Repetition Review ──────────────────────────────────────────────────

@router.post("/{vocab_id}/review", response_model=vocabulary_schemas.VocabularyResponse)
def submit_review(
    vocab_id: int,
    review: vocabulary_schemas.ReviewRequest,
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    """SM-2 flashcard review. quality: 1=again, 2=hard, 3=good, 4=easy"""
    db_vocab = db.query(vocabulary.Vocabulary).filter(
        vocabulary.Vocabulary.id == vocab_id,
        vocabulary.Vocabulary.user_id == current_user.id
    ).first()
    if not db_vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")

    now = datetime.utcnow()
    q = review.quality
    ef = db_vocab.ease_factor if db_vocab.ease_factor is not None else 2.5
    reps = db_vocab.repetition_count if db_vocab.repetition_count is not None else 0

    if q < 3:
        reps = 0
        interval_days = 1
        db_vocab.learning_status = vocabulary.LearningStatus.learning
    else:
        if reps == 0:
            interval_days = 1
        elif reps == 1:
            interval_days = 6
        else:
            prev_interval = max(1, (db_vocab.next_review_date.replace(tzinfo=None) - now).days) if db_vocab.next_review_date else 6
            interval_days = max(1, round(prev_interval * ef))
        reps += 1
        ef = max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
        db_vocab.learning_status = (
            vocabulary.LearningStatus.mastered if interval_days >= 21
            else vocabulary.LearningStatus.learning
        )

    db_vocab.ease_factor = ef
    db_vocab.repetition_count = reps
    db_vocab.next_review_date = now + timedelta(days=interval_days)
    db.commit()
    db.refresh(db_vocab)
    return db_vocab
