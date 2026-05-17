<div align="center">

<img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=14&pause=1000&color=6366F1&center=true&vCenter=true&width=500&lines=Reading+Intelligence+%F0%9F%93%96;AI-Assisted+Vocabulary+Learning+%F0%9F%A7%A0;Spaced+Repetition+%C2%B7+NLP+%C2%B7+Analytics+%F0%9F%93%8A" alt="Typing SVG" />

# 📚 WordShelf

### Reading Intelligence & AI-Assisted Vocabulary Learning Platform

*Transform passive reading into structured, measurable language growth.*

<br/>

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![spaCy](https://img.shields.io/badge/spaCy-NLP-09A3D5?style=for-the-badge&logo=spacy&logoColor=white)](https://spacy.io)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge)](LICENSE)

<br/>

</div>

---

## 🌟 Overview

WordShelf is a full-stack vocabulary learning platform built around the idea that **reading and vocabulary growth should be tracked together**. You add the books you're reading, capture words you encounter, and WordShelf handles the rest — auto-fetching definitions, scheduling review sessions with spaced repetition, evaluating your sentence usage with NLP, and visualising your progress through a rich learning analytics dashboard.

---

## ✨ Features

| Icon | Feature | Description |
|:---:|---|---|
| 📖 | **Digital Bookshelf** | Track books with `to_read`, `reading`, and `completed` statuses. Monitor page progress and fetch covers automatically from Open Library. |
| 🔤 | **Vocabulary Capture** | Add words manually or paste a passage and let the NLP engine extract the hardest, rarest words automatically. |
| 📝 | **Auto Definitions** | On adding a word, WordShelf calls the Free Dictionary API to auto-populate the definition and an example sentence. |
| 🧠 | **Spaced Repetition (SM-2)** | Words are scheduled for review using the SM-2 algorithm — `ease_factor`, `repetition_count`, and `next_review_date` update after every flashcard session. |
| 🃏 | **Flashcard System** | Flip-card interface shows words due for review. Mark correct or incorrect to update your SM-2 schedule. |
| 🤖 | **AI Sentence Evaluator** | Write a sentence using a word and get scored feedback. spaCy checks verb presence, subject presence, part-of-speech match, and sentence quality. |
| 📊 | **Learning Analytics** | Reading Intelligence Score, daily streak tracker, vocabulary growth chart (week / month / year), and a GitHub-style activity heatmap. |
| 🔐 | **User Authentication** | JWT-based login with bcrypt password hashing. Protected routes on both frontend and backend. |
| 🌙 | **Dark Mode** | Full light/dark theme support via `ThemeContext`. |

---

## 🛠️ Tech Stack

<div align="center">

### 🎨 Frontend

| Technology | Purpose |
|---|---|
| ![React](https://img.shields.io/badge/React_19-20232A?style=flat&logo=react&logoColor=61DAFB) | UI framework with hooks & context |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) | Fast dev server & bundler |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white) | Utility-first CSS |
| ![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=flat&logo=framer&logoColor=white) | Animations & transitions |
| ![Recharts](https://img.shields.io/badge/Recharts-FF6384?style=flat) | Charts & analytics visualisations |
| ![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=flat&logo=reacthookform&logoColor=white) | Form state management |
| ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white) | HTTP client |

### ⚙️ Backend

| Technology | Purpose |
|---|---|
| ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white) | Async REST API framework |
| ![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=flat&logo=python&logoColor=white) | Core language |
| ![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat&logo=sqlalchemy&logoColor=white) | ORM + SQLite database |
| ![spaCy](https://img.shields.io/badge/spaCy-09A3D5?style=flat) | NLP — POS tagging, dependency parsing |
| ![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white) | Authentication tokens |

### 🌐 External APIs

| API | Usage |
|---|---|
| 📖 Free Dictionary API | Auto-fetch word definitions & example sentences |
| 🏛️ Open Library API | Book cover art & metadata |

</div>

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│            🎨  Frontend  (React + Vite)                │
│  Landing  Login  Dashboard  Bookshelf  Vocabulary      │
│  Flashcards  Profile  Analytics  ThemeContext          │
└───────────────────────┬────────────────────────────────┘
                        │  🔐 REST API (JWT Bearer)
┌───────────────────────▼────────────────────────────────┐
│           ⚙️  Backend  (FastAPI + Uvicorn)              │
│                                                        │
│  /auth       /bookshelf    /vocabulary    /analytics   │
│  ────────    ──────────    ───────────    ──────────   │
│  Register    CRUD books    CRUD words     RI Score     │
│  Login       Page track    SM-2 review    Streak       │
│  Profile     Cover fetch   NLP extract    Heatmap      │
│                            Usage eval     Growth chart │
│                                                        │
│  🧩 Services:  dictionary.py │ nlp.py │ evaluator.py   │
└──────────┬──────────────────────────────┬─────────────┘
           │  🗄️ SQLAlchemy ORM           │  🌐 httpx
┌──────────▼──────────────┐   ┌──────────▼──────────────┐
│  💾 SQLite (wordshelf)  │   │   🌍 External APIs       │
│  users  │  books        │   │  📖 Free Dictionary      │
│  vocabularies           │   │  🏛️ Open Library         │
└─────────────────────────┘   └─────────────────────────┘
```

---

## 📁 Project Structure

```
📦 wordshelf/
├── 🎨 frontend/
│   ├── src/
│   │   ├── 🧩 components/
│   │   │   ├── Layout.jsx          # Sidebar + nav shell
│   │   │   └── ProtectedRoute.jsx  # Auth gate
│   │   ├── 🔄 context/
│   │   │   ├── AuthContext.jsx     # JWT + user state
│   │   │   └── ThemeContext.jsx    # Dark/light mode
│   │   ├── 📄 pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx / Register.jsx
│   │   │   ├── Dashboard.jsx       # Analytics overview
│   │   │   ├── Bookshelf.jsx       # Book tracker
│   │   │   ├── Vocabulary.jsx      # Word list + capture
│   │   │   ├── Flashcards.jsx      # SM-2 review session
│   │   │   └── Profile.jsx
│   │   ├── 🔧 utils/
│   │   │   ├── api.js              # Axios instance with auth header
│   │   │   └── cn.js               # Tailwind class utility
│   │   └── App.jsx                 # Route definitions
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── ⚙️ backend/
│   ├── app/
│   │   ├── 🔐 core/
│   │   │   ├── security.py         # JWT creation, bcrypt hashing
│   │   │   └── dependencies.py     # get_current_active_user
│   │   ├── 🗄️ models/
│   │   │   ├── user.py             # User table
│   │   │   ├── vocabulary.py       # Vocabulary + SM-2 fields
│   │   │   ├── bookshelf.py        # Book table
│   │   │   └── *_schemas.py        # Pydantic request/response schemas
│   │   ├── 🛣️ routes/
│   │   │   ├── auth.py             # Register, login, profile
│   │   │   ├── vocabulary.py       # CRUD, review, NLP extract, eval
│   │   │   ├── bookshelf.py        # Book CRUD + progress
│   │   │   └── analytics.py        # RI score, streak, growth, heatmap
│   │   ├── 🧩 services/
│   │   │   ├── dictionary.py       # Free Dictionary API client
│   │   │   ├── nlp.py              # Zipf-based vocab extractor (spaCy)
│   │   │   └── evaluator.py        # Sentence usage scorer (spaCy + SM-2)
│   │   ├── database.py             # SQLAlchemy engine + session
│   │   └── main.py                 # FastAPI app + CORS + router registration
│   ├── requirements.txt
│   └── wordshelf.db
│
└── 📄 README.md
```

---

## 🚀 Installation

### ✅ Prerequisites

- 🟢 Node.js 18+
- 🐍 Python 3.10+
- 📦 pip

### 1️⃣ Clone the repository

```bash
git clone https://github.com/IshitaBanerjee05/WordShelf.git
cd WordShelf
```

### 2️⃣ Backend setup

```bash
cd backend

# Create and activate a virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Download the spaCy language model
python -m spacy download en_core_web_sm

# Start the development server
uvicorn app.main:app --reload --port 8000
```

> 🌐 API: `http://localhost:8000`  
> 📖 Swagger UI: `http://localhost:8000/docs`

### 3️⃣ Frontend setup

```bash
cd frontend
npm install
npm run dev
```

> 🖥️ App: `http://localhost:5173`

### 4️⃣ Environment variables

Create a `.env` file in the `backend/` directory — **never commit this file**:

```env
# 🔐 Backend
SECRET_KEY=your_strong_random_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=sqlite:///./wordshelf.db
```

> ⚠️ **Note:** The current `security.py` uses a hardcoded development key. Replace it with an environment variable before deploying.

---

## 📡 API Reference

### 🔐 Auth

| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/auth/register` | Create a new account |
| `POST` | `/auth/login` | Login and receive a JWT |
| `GET` | `/auth/me` | Get current user profile |
| `PUT` | `/auth/me` | Update email or password |

### 🔤 Vocabulary

| Method | Endpoint | Description |
|:---:|---|---|
| `GET` | `/vocabulary/` | List all vocabulary words |
| `POST` | `/vocabulary/` | Add a word (auto-fetches definition) |
| `GET` | `/vocabulary/review/due` | Get words due for SM-2 review |
| `POST` | `/vocabulary/{id}/review` | Submit a review result (quality 1–4) |
| `POST` | `/vocabulary/extract` | Extract vocab from a text passage |
| `POST` | `/vocabulary/{id}/evaluate` | Score a practice sentence |

### 📖 Bookshelf

| Method | Endpoint | Description |
|:---:|---|---|
| `GET` | `/bookshelf/` | List all books |
| `POST` | `/bookshelf/` | Add a book |
| `PUT` | `/bookshelf/{id}` | Update progress or status |

### 📊 Analytics

| Method | Endpoint | Description |
|:---:|---|---|
| `GET` | `/analytics/` | Reading Intelligence Score + stats |
| `GET` | `/analytics/streak` | Current daily learning streak |
| `GET` | `/analytics/vocab-growth` | Word count over time (week/month/year) |
| `GET` | `/analytics/activity` | Per-day activity for heatmap |

> 🔒 All endpoints except `/auth/register` and `/auth/login` require `Authorization: Bearer <token>`

---

## 🧠 How Spaced Repetition Works

WordShelf implements the **SM-2 algorithm**. Each vocabulary word stores:

- 📈 `ease_factor` — starts at 2.5; reflects how hard the word is for you
- 🔢 `repetition_count` — consecutive correct reviews
- 📅 `next_review_date` — when the word surfaces again

After every flashcard review, a quality score (1–4) is submitted:

```
⭐⭐⭐⭐  quality 4 (easy)   → long interval, ease_factor increases slightly
⭐⭐⭐    quality 3 (good)   → normal interval growth
⭐⭐      quality 2 (hard)   → short interval, ease_factor decreases
⭐        quality 1 (again)  → resets to day 1, ease_factor drops
```

Words progress through: `🆕 new` → `📖 learning` → `🏆 mastered`

---

## 🔍 How the NLP Vocabulary Extractor Works

Paste any text passage and WordShelf extracts the hardest, most academically valuable words:

1. 🔡 spaCy tokenises the text and filters stopwords, punctuation, and short words
2. 📌 Only content words (nouns, verbs, adjectives, adverbs) are kept
3. 📉 Each word is scored with **Zipf frequency** (via `wordfreq`) — lower score = rarer word
4. 🚫 Words above a Zipf threshold of 4.5 (too common) are discarded
5. 🏷️ Results are ranked hardest-first with difficulty labels: `uncommon` · `advanced` · `rare`

---

## ✍️ How the Sentence Evaluator Works

Write a sentence using a vocabulary word and receive scored feedback:

| Check | Points |
|---|:---:|
| ✅ Word present in sentence | Base |
| 📏 Sentence ≥ 5 words | +1 |
| 🔄 Verb detected (spaCy) | +2 |
| 👤 Subject detected (spaCy) | +1 |
| 🏷️ Correct part of speech | +2 |
| 📝 Sentence ≥ 10 words | +1 |

The final **1–10 score** maps to an SM-2 quality rating, so good sentences actually advance your review schedule.

---

## 📊 Reading Intelligence Score

A composite metric that rewards deep, consistent learning:

```
🧠 RI Score = (total vocabulary    ×  2)
            + (mastered words      ×  5)
            + (books added         × 10)
            + (books completed     × 25)
            + (total pages read    × 0.05)
```

---

## 🔮 Future Enhancements

- [ ] 🤖 **Ollama LLM integration** — richer semantic sentence evaluation (stub already in codebase)
- [ ] 🔄 **Refresh tokens** — seamless re-authentication without re-login
- [ ] 🌍 **LibreTranslate API** — multilingual vocabulary support
- [ ] 💬 **AI chatbot** — interactive word learning conversations
- [ ] 🎯 **Personalised recommendations** — smarter review scheduling from learning patterns
- [ ] 🎙️ **Voice input** — speak words aloud to capture vocabulary
- [ ] 📱 **Mobile app** — React Native companion app
- [ ] 🐘 **PostgreSQL** — production-grade database for multi-user deployments
- [ ] 🐳 **Docker Compose** — one-command setup for deployment

---

## 🤝 Contributing

Contributions are welcome!

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/your-feature`)
3. 💾 Commit your changes (`git commit -m 'Add some feature'`)
4. 📤 Push to the branch (`git push origin feature/your-feature`)
5. 🔃 Open a Pull Request

Please follow existing patterns — FastAPI dependency injection on the backend, React context + hooks on the frontend.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👩‍💻 Authors

<div align="center">

| | Name |
|:---:|:---:|
| 👩‍💻 | **Ishita Banerjee** |
| 👨‍💻 | **Kalash Kale** |

</div>

---

<div align="center">

### 💡 WordShelf uniquely combines reading tracking, AI-assisted vocabulary learning, and measurable analytics into one platform.

*Every book you read makes you a better reader. 📚✨*

<br/>

![Made with ❤️](https://img.shields.io/badge/Made_with-❤️-red?style=for-the-badge)
![Open Source](https://img.shields.io/badge/Open-Source-brightgreen?style=for-the-badge&logo=opensourceinitiative&logoColor=white)

</div>
