# WordShelf — Incomplete Features Audit

## 1. Dashboard (`Dashboard.jsx`)

### 🔴 Current Streak — Hardcoded to Zero
The "Current Streak" stat card always shows **"0 Days"** — there is no backend endpoint or frontend logic that calculates a daily streak from vocabulary activity data.

```jsx
// Dashboard.jsx:190
value="0 Days"   // ← hardcoded, never updates
```

**What's needed:** A backend `/analytics/streak` endpoint that inspects consecutive days of vocabulary activity, and wiring that into the Dashboard.

---

### 🟡 Vocabulary Growth Chart — Time Filter is a No-op
The dropdown lets the user pick "This Week / This Month / This Year" but it has no `onChange` handler — changing it does nothing. The chart always shows the 7-day view.

```jsx
// Dashboard.jsx:218-222
<select ...>   // ← no onChange, no state
  <option>This Week</option>
  <option>This Month</option>
  <option>This Year</option>
</select>
```

**What's needed:** State tracking the selected period + backend query params (or additional endpoints) for monthly/yearly aggregations.

---

### 🟡 "Suggested Revision" Section — Always Empty
The section is rendered with a permanent empty state and a "View All" button that goes nowhere (no `onClick`). It should show vocabulary words due for flashcard review (the `/vocabulary/review/due` endpoint already exists).

```jsx
// Dashboard.jsx:262-277
<div className="flex flex-col items-center ...">  // ← static placeholder
  <p>No words to revise yet.</p>
</div>
```

**What's needed:** Fetch from `/vocabulary/review/due`, display the top 5–10 words, and wire the "View All" button to `/flashcards`.

---

### 🟡 Dashboard Has No Loading / Error States
The three API calls (`/analytics/`, `/vocab-growth`, `/activity`) are fire-and-forget with `catch(console.error)`. If any request fails, the user sees nothing — no spinner during load and no error message on failure.

---

## 2. Vocabulary Page (`Vocabulary.jsx`)

### 🔴 AI Extract / Smart Vocabulary Extractor — Non-functional
The "AI Extract" panel opens, renders a textarea, and has an "Extract Words" button — but the button has no `onClick`. Clicking it does nothing.

```jsx
// Vocabulary.jsx:519
<button className="...">Extract Words</button>  // ← no onClick
```

The backend endpoint **does** exist (`POST /vocabulary/extract-from-text`) and the NLP service (`nlp.py` using SpaCy) is implemented. The frontend just never calls it. After extraction, there is also no UI to let the user select which suggested words to save.

**What's needed:**
1. Wire the "Extract Words" button to call `POST /vocabulary/extract-from-text`.
2. Display the returned word list as selectable chips.
3. For each selected word, call `POST /vocabulary/` to save it.

---

### 🔴 "AI Context Practice" — Evaluate Usage Button is a No-op
Every word's detail panel shows a text area and an "Evaluate Usage" button, but the button has no `onClick`. There is no backend endpoint for usage evaluation either.

```jsx
// Vocabulary.jsx:749-751
<button className="...">Evaluate Usage</button>  // ← no onClick, no API
```

**What's needed:** Either a backend NLP endpoint that scores the sentence, or a clear decision to remove this UI until it's ready.

---

### 🟡 Vocabulary Page — No Delete / Edit Capability
Words can be added but there is no way to delete or edit an entry from the UI. The backend has `PUT /vocabulary/{id}` and `DELETE /vocabulary/{id}` fully implemented.

---

## 3. Bookshelf (`Bookshelf.jsx`)

### 🟡 Book Cards — No Edit or Delete
Books can be added but there is no way to update a book's status/progress or delete it from the UI. The backend has `PUT /bookshelf/{id}` and `DELETE /bookshelf/{id}` fully implemented.

---

### 🟡 Book Cover Not Persisted
When a book is fetched from the backend on reload (`mapBackendBook`), the cover URL is always set to `null` because the `cover_i` (Open Library cover ID) is never stored in the database. On refresh, all books revert to the grey placeholder cover.

```js
// Bookshelf.jsx:24
cover: null,  // ← always null on load — cover_i never saved to DB
```

**What's needed:** Add a `cover_url` (or `open_library_cover_id`) field to the `Book` model and persist it on add.

---

### 🟡 Book Progress Tracking — Always 0%
`total_pages` and `current_page` are both sent as `0` when adding a book. There is no UI for the user to update their reading progress after adding.

---

### 🟡 "Words Learned" Counter Always 0
The `wordsLearned` field in `BookCard` is hardcoded to `0`. There's no linkage between vocabulary entries and the book they were sourced from.

---

## 4. Flashcards (`Flashcards.jsx`)

### 🟡 Wrong `api` Import Path
Flashcards imports from `'../utils/api'` while Bookshelf and Vocabulary correctly import from `'../utils/api'` too — but `Dashboard.jsx` imports from `'../services/api'`. These point to different files (`utils/api.js` vs `services/api.js`). This is an inconsistency that could silently break auth headers on the Dashboard.

```js
// Dashboard.jsx:5
import api from '../services/api';   // services/api.js — 434 bytes, simpler file

// Flashcards.jsx:4 / Bookshelf.jsx:7 / Vocabulary.jsx:7
import api from '../utils/api';      // utils/api.js — 1042 bytes, has auth interceptor
```

---

### 🟡 "Restart" Only Reshuffles In-Memory Cards
After a session completes, "Review Again" replays the same in-memory card list (already reviewed). It doesn't re-fetch due items from the backend.

---

## 5. Auth / User Profile

### 🟡 No User Profile Page
There's a `/auth/me` endpoint and a `GET /auth/me` call in `AuthContext`, but there is no Settings or Profile page where a user can view or update their username, email, or password.

---

## 6. Backend

### 🟡 Spaced Repetition is Very Rudimentary
The review endpoint uses a fixed 3-interval system (1/3/7 days). A standard SM-2 algorithm (tracking ease factor and repetition count) would be much more effective for long-term retention but is not implemented.

---

## 7. Missing / Planned Pages

The wildcard route (`path="*"`) renders a basic `<h2>Coming Soon</h2>` — suggesting there are pages planned but not yet built. Based on the feature set, likely candidates include:
- **Settings / Profile** page
- **Statistics / Progress** deep-dive page (beyond the Dashboard)

---

## Summary Table

| Feature | Location | Severity | Backend ready? |
|---|---|---|---|
| Current Streak counter | Dashboard | 🔴 Non-functional | ❌ No endpoint |
| Growth chart time filter | Dashboard | 🟡 Cosmetic stub | ❌ No monthly/yearly endpoint |
| Suggested Revision section | Dashboard | 🟡 Static placeholder | ✅ `/vocabulary/review/due` |
| Dashboard loading/error states | Dashboard | 🟡 UX gap | ✅ N/A |
| AI Extract — Extract Words button | Vocabulary | 🔴 Non-functional | ✅ `/vocabulary/extract-from-text` |
| AI Context Practice — Evaluate button | Vocabulary | 🔴 Non-functional | ❌ No endpoint |
| Vocabulary delete/edit | Vocabulary | 🟡 Missing CRUD | ✅ `PUT/DELETE /vocabulary/{id}` |
| Book delete/edit/progress | Bookshelf | 🟡 Missing CRUD | ✅ `PUT/DELETE /bookshelf/{id}` |
| Book cover not persisted | Bookshelf | 🟡 Data loss on reload | ❌ No DB column |
| Words Learned per book | Bookshelf | 🟡 Always 0 | ❌ No linkage |
| Dashboard API import mismatch | Dashboard | 🟡 Bug risk | ✅ N/A |
| Flashcard restart re-fetches | Flashcards | 🟡 UX gap | ✅ `/vocabulary/review/due` |
| User Profile / Settings page | App-wide | 🟡 Missing page | ✅ `/auth/me` |
| SM-2 spaced repetition | Backend | 🟡 Oversimplified | ✅ Endpoint exists |
