"""
Sentence usage evaluator — Tier 1 (spaCy rule-based).

Evaluates whether a user's practice sentence correctly uses a target vocabulary word.
Returns a structured result with score, flags, and feedback text.

The score maps directly to SM-2 quality for spaced repetition integration:
  score 1-3  → quality 1 (again)
  score 4-5  → quality 2 (hard)
  score 6-7  → quality 3 (good)
  score 8-10 → quality 4 (easy)

NOTE: Tier 2 (Ollama) hook is left as a commented stub at the bottom for future integration.
"""

import re
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
    _NLP_AVAILABLE = True
except OSError:
    nlp = None
    _NLP_AVAILABLE = False


def score_to_quality(score: int) -> int:
    """Map a 1-10 evaluation score to SM-2 quality (1-4)."""
    if score <= 3:
        return 1
    if score <= 5:
        return 2
    if score <= 7:
        return 3
    return 4


def evaluate_usage(word: str, sentence: str, definition: str, pos: str) -> dict:
    """
    Tier 1: spaCy rule-based evaluation of a practice sentence.

    Returns:
        {
            score: int,          # 1-10
            correct_usage: bool,
            grammar_ok: bool,
            word_present: bool,
            feedback: str,
            suggestion: str | None,
            quality: int,        # SM-2 quality (1-4)
            tier: str,
        }
    """
    sentence = sentence.strip()
    word_lower = word.lower()

    # ── Check 1: Word presence ───────────────────────────────────────────────
    # Match the word or its common inflections (simple regex)
    word_pattern = re.compile(
        rf'\b{re.escape(word_lower)}[a-z]{{0,4}}\b', re.IGNORECASE
    )
    word_present = bool(word_pattern.search(sentence))

    if not word_present:
        return {
            "score": 1,
            "correct_usage": False,
            "grammar_ok": False,
            "word_present": False,
            "feedback": (
                f"The word \"{word}\" doesn't appear in your sentence. "
                f"Make sure to use it directly — for example: "
                f"\"The {word_lower} nature of the situation surprised everyone.\""
            ),
            "suggestion": None,
            "quality": 1,
            "tier": "basic",
        }

    checks: dict[str, bool] = {"word_present": True}
    score = 3  # base score for having the word

    # ── Check 2: Sentence length ─────────────────────────────────────────────
    word_count = len(sentence.split())
    if word_count < 5:
        checks["long_enough"] = False
        feedback_notes = [
            f"Your sentence is very short ({word_count} words). "
            "Try expanding it to show you understand the context in which the word is used."
        ]
        return {
            "score": 2,
            "correct_usage": False,
            "grammar_ok": False,
            "word_present": True,
            "feedback": " ".join(feedback_notes),
            "suggestion": None,
            "quality": 1,
            "tier": "basic",
        }
    else:
        checks["long_enough"] = True
        score += 1

    # ── spaCy analysis ───────────────────────────────────────────────────────
    grammar_ok = True
    pos_match = True
    has_verb = False
    has_subject = False
    notes = []

    if _NLP_AVAILABLE and nlp:
        doc = nlp(sentence)

        # Check grammar basics
        has_verb = any(t.pos_ in {"VERB", "AUX"} for t in doc)
        has_subject = any(t.dep_ in {"nsubj", "nsubjpass"} for t in doc)

        if not has_verb:
            grammar_ok = False
            notes.append("Your sentence is missing a verb — every complete sentence needs one.")
        else:
            score += 2

        if not has_subject:
            grammar_ok = False
            notes.append("Make sure your sentence has a clear subject (who or what is doing the action).")
        else:
            score += 1

        # Check POS of the target word in the sentence
        if pos and pos.lower() != "unknown":
            spacy_pos_map = {
                "noun": "NOUN", "verb": "VERB",
                "adjective": "ADJ", "adverb": "ADV",
                "adj": "ADJ", "adv": "ADV",
            }
            expected_spacy_pos = spacy_pos_map.get(pos.lower())
            if expected_spacy_pos:
                # Find the token that matches the word
                for token in doc:
                    if word_pattern.match(token.text):
                        if token.pos_ == expected_spacy_pos:
                            score += 2
                        else:
                            pos_match = False
                            notes.append(
                                f"\"{word}\" is used as a {token.pos_.lower()} here, "
                                f"but it should be used as a {pos.lower()}. "
                                f"Definition hint: {definition[:80] if definition else '—'}."
                            )
                        break
        else:
            # Can't check POS, give partial credit
            score += 1

        # Sentence variety bonus
        if word_count >= 10:
            score += 1

    else:
        # spaCy not available — do minimal checks
        has_verb = True   # assume OK
        score += 3        # give benefit of the doubt

    # Cap score
    score = min(10, max(1, score))
    correct_usage = grammar_ok and pos_match and word_present and has_verb

    # ── Build feedback ───────────────────────────────────────────────────────
    if score >= 8:
        opener = f"Excellent work! You used \"{word}\" confidently and correctly."
        if word_count >= 12:
            opener += " Your sentence is rich and detailed."
    elif score >= 6:
        opener = f"Good job! \"{word}\" fits naturally in your sentence."
    elif score >= 4:
        opener = f"You're on the right track with \"{word}\", but there's room to improve."
    else:
        opener = f"Keep practising! Using \"{word}\" correctly takes a bit of work."

    if notes:
        full_feedback = opener + " " + " ".join(notes)
    else:
        full_feedback = opener

    # Suggestion for lower scores
    suggestion = None
    if score < 7 and definition:
        suggestion = (
            f"Try something like: \"The {word_lower} quality of the experience "
            f"showed that {definition[:50].lower().rstrip('.')}.\""
        )

    quality = score_to_quality(score)

    return {
        "score": score,
        "correct_usage": correct_usage,
        "grammar_ok": grammar_ok,
        "word_present": True,
        "feedback": full_feedback,
        "suggestion": suggestion,
        "quality": quality,
        "tier": "basic",
    }


# ── Tier 2 stub (Ollama) ─────────────────────────────────────────────────────
# async def evaluate_usage_ollama(word, sentence, definition, pos, model) -> dict:
#     """Future: use Ollama LLM for richer contextual evaluation."""
#     pass
