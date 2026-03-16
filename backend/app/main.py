from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, bookshelf, vocabulary, analytics
from app.database import engine
from app.models import user, bookshelf as bookshelf_model, vocabulary as vocabulary_model

# Create database tables
user.Base.metadata.create_all(bind=engine)
bookshelf_model.Base.metadata.create_all(bind=engine)
vocabulary_model.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WordShelf API",
    description="API for the WordShelf vocabulary learning platform",
    version="1.0.0"
)

# CORS setup
origins = [
    "http://localhost",
    "http://localhost:5173", # Vite default
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(bookshelf.router)
app.include_router(vocabulary.router)
app.include_router(analytics.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the WordShelf API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
