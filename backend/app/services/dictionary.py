import httpx
from typing import Optional, Dict, Any

DICTIONARY_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/"

async def fetch_word_definition(word: str) -> Optional[Dict[str, Any]]:
    """
    Fetches the definition, part of speech, and example for a given word
    using the Free Dictionary API.
    """
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{DICTIONARY_API_URL}{word}")
            if response.status_code == 200:
                data = response.json()
                if not data or not isinstance(data, list):
                    return None
                    
                entry = data[0]
                meanings = entry.get("meanings", [])
                
                if not meanings:
                    return None
                    
                # Get the first meaning and its first definition
                first_meaning = meanings[0]
                definitions = first_meaning.get("definitions", [])
                
                if not definitions:
                    return None
                    
                first_def = definitions[0]
                return {
                    "word": word,
                    "definition": first_def.get("definition", ""),
                    "part_of_speech": first_meaning.get("partOfSpeech", ""),
                    "example": first_def.get("example", "")
                }
            return None
        except httpx.RequestError:
            return None
