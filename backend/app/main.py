from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

@app.get("/")
def read_root():
    return {"message": "Welcome to the WordShelf API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
