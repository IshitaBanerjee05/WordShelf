import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Warning: SpaCy en_core_web_sm model not found. Text processing features might not work.")
    nlp = None

def extract_vocabulary_from_text(text: str, max_words: int = 15):
    """
    Extracts informative vocabulary words from a piece of text using SpaCy NLP.
    Filters out stopwords, punctuation, numbers, and basic entities.
    """
    if not nlp:
        return []

    doc = nlp(text)
    extracted_words = []

    for token in doc:
        # Filter conditions
        if (
            not token.is_stop 
            and not token.is_punct 
            and not token.like_num 
            and not token.is_space
            and token.is_alpha
            and len(token.text) > 3
        ):
            # We want to extract base lemmas for vocabulary learning
            lemma = token.lemma_.lower()
            if lemma not in extracted_words:
                extracted_words.append(lemma)
                
            if len(extracted_words) >= max_words:
                break

    return extracted_words
