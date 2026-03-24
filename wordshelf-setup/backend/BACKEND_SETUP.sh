# ══════════════════════════════════════════
#  WORDSHELF BACKEND — Flask/FastAPI Setup
# ══════════════════════════════════════════

# STEP 1 — Create backend folder (from project root /wordshelf)
mkdir backend
cd backend

# STEP 2 — Create & activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

# STEP 3 — Install all dependencies
pip install -r requirements.txt

# STEP 4 — Copy env file
cp .env.example .env
# Then fill in your DB credentials and API keys in .env

# STEP 5 — Run the dev server
# Flask:
flask run --debug

# OR FastAPI:
uvicorn main:app --reload --port 5000
