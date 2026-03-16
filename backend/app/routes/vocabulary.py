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
