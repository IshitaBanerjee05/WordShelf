"""
WordShelf — Database Configuration (SQLAlchemy + MySQL)
"""
from sqlalchemy import create_engine, Column, Integer, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/wordshelf_db")

# ── Engine ────────────────────────────────────────────────────
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # test connections before use
    pool_recycle=3600,        # recycle connections every hour
    echo=os.getenv("DEBUG", "False") == "True",
)

# ── Session factory ───────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Base model ────────────────────────────────────────────────
Base = declarative_base()

class TimestampMixin:
    """Adds created_at and updated_at to every model automatically."""
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(),
                        onupdate=func.now(), nullable=False)

# ── FastAPI dependency ────────────────────────────────────────
def get_db():
    """Yield a DB session, close it after request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
