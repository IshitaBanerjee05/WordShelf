"""
Enhanced vocabulary extraction using spaCy + wordfreq.

Difficulty scoring is based on the Zipf word frequency scale:
  - Zipf 7-8: extremely common (the, be, go)
  - Zipf 5-6: common words (house, work, love)
  - Zipf 3-4: uncommon / literary (ephemeral, melancholy)
  - Zipf 0-2: very rare / academic (sesquipedalian, callipygian)

Lower Zipf score → harder word → better vocabulary candidate.

NOTE: Tier 2 (Ollama) stub is left as a no-op `_ollama_extract()` for future integration.
"""

import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Warning: SpaCy en_core_web_sm not found. NLP features will be limited.")
    nlp = None

try:
    from wordfreq import zipf_frequency
    _WORDFREQ_AVAILABLE = True
except ImportError:
    _WORDFREQ_AVAILABLE = False
    print("Warning: wordfreq not installed. Using length-based difficulty fallback.")


def _zipf_score(word: str) -> float:
    """Returns Zipf frequency (lower = rarer/harder). Fallback: estimate from length."""
    if _WORDFREQ_AVAILABLE:
        return zipf_frequency(word.lower(), 'en')
    # Rough fallback: longer words tend to be harder
    return max(0.0, 7.0 - len(word) * 0.3)


def difficulty_label(zipf: float) -> str:
    """Maps Zipf score to a human-readable difficulty label."""
    if zipf >= 5.0:
        return "common"
    if zipf >= 4.0:
        return "advanced"
    if zipf >= 2.5:
        return "uncommon"
    return "rare"


def difficulty_score_normalised(zipf: float) -> float:
    """Maps Zipf 0-7 to a 0-1 difficulty score (1 = hardest)."""
    return round(max(0.0, min(1.0, (7.0 - zipf) / 7.0)), 3)


# POS tags we care about for vocabulary learning
_CONTENT_POS = {"NOUN", "VERB", "ADJ", "ADV"}

# Min Zipf threshold — only words rarer than this are extracted
_MIN_ZIPF_THRESHOLD = 4.5   # excludes very common words


def extract_vocabulary_from_text(text: str, max_words: int = 15) -> list[dict]:
    """
    Extracts the hardest/most-literary vocabulary words from a passage.

    Returns a list of dicts sorted by difficulty (hardest first):
      { word, pos, zipf_score, difficulty_label, difficulty_score }

    Tier 2 hook: If Ollama is available in the future, call `_ollama_extract()`
    instead and return its results here.
    """
    if not nlp:
        return _fallback_extract(text, max_words)

    doc = nlp(text)
    seen_lemmas: set[str] = set()
    candidates: list[dict] = []

    for token in doc:
        if (
            not token.is_stop
            and not token.is_punct
            and not token.like_num
            and not token.is_space
            and token.is_alpha
            and len(token.text) > 3
            and token.pos_ in _CONTENT_POS
        ):
            lemma = token.lemma_.lower()
            if lemma in seen_lemmas:
                continue
            seen_lemmas.add(lemma)

            zipf = _zipf_score(lemma)

            # Only keep uncommon words
            if zipf > _MIN_ZIPF_THRESHOLD:
                continue

            candidates.append({
                "word": lemma,
                "pos": token.pos_.lower(),
                "zipf_score": zipf,
                "difficulty_label": difficulty_label(zipf),
                "difficulty_score": difficulty_score_normalised(zipf),
            })

    # Sort hardest first
    candidates.sort(key=lambda x: x["zipf_score"])
    return candidates[:max_words]


def _fallback_extract(text: str, max_words: int) -> list[dict]:
    """Simple fallback when spaCy is not available."""
    import re
    common = {"this", "that", "with", "have", "from", "they", "will", "been", "were",
              "their", "said", "each", "which", "when", "there", "what", "your"}
    words = re.findall(r'\b[a-zA-Z]{5,}\b', text)
    seen: set[str] = set()
    results = []
    for w in words:
        l = w.lower()
        if l not in common and l not in seen:
            seen.add(l)
            zipf = _zipf_score(l)
            if zipf <= _MIN_ZIPF_THRESHOLD:
                results.append({
                    "word": l, "pos": "unknown",
                    "zipf_score": zipf,
                    "difficulty_label": difficulty_label(zipf),
                    "difficulty_score": difficulty_score_normalised(zipf),
                })
        if len(results) >= max_words:
            break
    results.sort(key=lambda x: x["zipf_score"])
    return results


# ── Tier 2 stub (Ollama) ─────────────────────────────────────────────────────
# async def _ollama_extract(text: str, max_words: int, model: str) -> list[dict]:
#     """Future: use Ollama LLM to extract the most literary words."""
#     pass
