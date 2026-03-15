from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import bookshelf, bookshelf_schemas, user
from app.core.dependencies import get_current_active_user

router = APIRouter(
    prefix="/bookshelf",
    tags=["Bookshelf"]
)

@router.post("/", response_model=bookshelf_schemas.BookResponse)
def create_book(
    book: bookshelf_schemas.BookCreate, 
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    db_book = bookshelf.Book(**book.model_dump(), user_id=current_user.id)
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

@router.get("/", response_model=List[bookshelf_schemas.BookResponse])
def get_books(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    books = db.query(bookshelf.Book).filter(bookshelf.Book.user_id == current_user.id).offset(skip).limit(limit).all()
    return books

@router.get("/{book_id}", response_model=bookshelf_schemas.BookResponse)
def get_book(
    book_id: int, 
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    book = db.query(bookshelf.Book).filter(bookshelf.Book.id == book_id, bookshelf.Book.user_id == current_user.id).first()
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@router.put("/{book_id}", response_model=bookshelf_schemas.BookResponse)
def update_book(
    book_id: int, 
    book_update: bookshelf_schemas.BookUpdate, 
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    db_book = db.query(bookshelf.Book).filter(bookshelf.Book.id == book_id, bookshelf.Book.user_id == current_user.id).first()
    if db_book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    
    update_data = book_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_book, key, value)
        
    db.commit()
    db.refresh(db_book)
    return db_book

@router.delete("/{book_id}", response_model=dict)
def delete_book(
    book_id: int, 
    db: Session = Depends(get_db),
    current_user: user.User = Depends(get_current_active_user)
):
    db_book = db.query(bookshelf.Book).filter(bookshelf.Book.id == book_id, bookshelf.Book.user_id == current_user.id).first()
    if db_book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    
    db.delete(db_book)
    db.commit()
    return {"message": "Book deleted successfully"}
