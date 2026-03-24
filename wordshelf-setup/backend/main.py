"""
WordShelf Backend — FastAPI Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

# ── Import routers (add as you build each module) ──
# from routes.auth       import router as auth_router
# from routes.bookshelf  import router as bookshelf_router
# from routes.vocabulary import router as vocabulary_router
# from routes.revision   import router as revision_router
# from routes.analytics  import router as analytics_router
# from routes.user       import router as user_router

# ── App instance ──────────────────────────────────────────────
app = FastAPI(
    title="WordShelf API",
    description="Multilingual AI-assisted vocabulary learning platform",
    version="1.0.0",
    docs_url="/api/docs",      # Swagger UI at http://localhost:5000/api/docs
    redoc_url="/api/redoc",
)

# ── CORS ─────────────────────────────────────────────────────
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers (uncomment as you build each phase) ───────────────
# app.include_router(auth_router,       prefix="/api/auth",       tags=["Auth"])
# app.include_router(user_router,       prefix="/api/user",       tags=["User"])
# app.include_router(bookshelf_router,  prefix="/api/bookshelf",  tags=["Bookshelf"])
# app.include_router(vocabulary_router, prefix="/api/vocabulary", tags=["Vocabulary"])
# app.include_router(revision_router,   prefix="/api/revision",   tags=["Revision"])
# app.include_router(analytics_router,  prefix="/api/analytics",  tags=["Analytics"])

# ── Health check ─────────────────────────────────────────────
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "app":    "WordShelf API",
        "version":"1.0.0",
    }

# ── Run directly ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
