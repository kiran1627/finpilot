import requests
import os
import logging
import time
from dotenv import load_dotenv

# ==================================================
# OpenRouter API key (loaded by main.py)
# ==================================================
load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# ==================================================
# Safe OpenRouter client
# ==================================================
def call_openrouter(prompt: str) -> str | None:
    """
    Best-effort OpenRouter call.

    Guarantees:
    - NEVER raises
    - NEVER blocks autonomy
    - Returns None if LLM unavailable
    - Swagger-safe
    """

    if not OPENROUTER_API_KEY:
        logging.info("ℹ️ LLM disabled (no API key)")
        return None

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost",
                "X-Title": "FinPilot"
            },
            json={
                "model": "google/gemma-3n-e2b-it:free",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.4
            },
            timeout=6
        )

        if response.status_code == 429:
            logging.info("ℹ️ LLM skipped due to rate limit (expected)")
            return None

        response.raise_for_status()

        return response.json()["choices"][0]["message"]["content"]

    except requests.exceptions.Timeout:
        logging.info("ℹ️ LLM timeout — skipped")
        return None

    except Exception as e:
        logging.info(f"ℹ️ LLM unavailable — skipped ({e})")
        return None

