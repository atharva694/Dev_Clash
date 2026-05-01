import os
import time
import random
import concurrent.futures
from pathlib import Path
from google import genai
from dotenv import load_dotenv

# Load .env.local from project root (two levels up from agents/)
env_path = Path(__file__).resolve().parent.parent.parent / ".env.local"
load_dotenv(dotenv_path=str(env_path))

# ✅ Cache clients at module load time — avoids recreating on every API call
_clients: list[genai.Client] = []

def _get_clients() -> list[genai.Client]:
    global _clients
    if _clients:
        return _clients

    keys = []
    if os.getenv("GEMINI_API_KEYS"):
        keys = [k.strip() for k in os.getenv("GEMINI_API_KEYS").split(",") if k.strip()]
    else:
        keys = [
            os.getenv(f"GEMINI_API_KEY{'_' + str(i) if i > 1 else ''}")
            for i in range(1, 10)
        ]
        keys = [k.strip() for k in keys if k and k.strip()]

    if not keys:
        raise ValueError("No Gemini API keys configured. Check your .env.local file.")

    _clients = [genai.Client(api_key=k) for k in keys]
    print(f"✅ Initialized {len(_clients)} Gemini client(s).")
    return _clients


# Model priority order — newest/least-congested first, older stable as last resort
# gemini-3-flash-preview : newest, best for coding, lower 503 rate (less traffic on it)
# gemini-2.5-flash       : stable GA, widely available
# gemini-2.5-flash-lite  : lightest, almost never overloaded
# gemini-3.1-pro-preview : most powerful, good fallback
# gemini-2.0-flash       : being deprecated — highest 503 rate, last resort only
FALLBACK_MODELS = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.1-pro-preview",
    "gemini-2.0-flash",
]

# Backoff config for 503 — waits: 2s, 4s, 8s before giving up on a key
_MAX_RETRIES = 3
_BACKOFF_BASE = 2  # seconds


def _is_retryable(err: str) -> bool:
    """503 and overload errors are transient — worth retrying with backoff."""
    return "503" in err or "UNAVAILABLE" in err or "overloaded" in err.lower()


def _call_with_backoff(operation, client: genai.Client, model_name: str):
    """
    Wraps an operation with exponential backoff for 503/overload errors only.
    Non-retryable errors (404, 429, auth) raise immediately.
    """
    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            return operation(client, model_name)
        except Exception as e:
            err = str(e)
            if _is_retryable(err) and attempt < _MAX_RETRIES:
                # Exponential backoff + jitter to avoid thundering herd across keys
                wait = (_BACKOFF_BASE ** attempt) + random.uniform(0, 1)
                print(f"  ⏳ 503 overload — retrying in {wait:.1f}s (attempt {attempt}/{_MAX_RETRIES})...")
                time.sleep(wait)
            else:
                raise  # Non-retryable, or retries exhausted


def with_key_rotation(operation, preferred_model="gemini-3-flash-preview"):
    clients = _get_clients()

    # Build model list: preferred first, then fallbacks (no duplicates)
    models_to_try = list(dict.fromkeys([preferred_model] + FALLBACK_MODELS))

    last_error = None

    for model_name in models_to_try:
        print(f"\n--- 🏎️ Racing {len(clients)} keys on model: {model_name} ---")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(clients)) as executor:
            future_to_client = {
                executor.submit(_call_with_backoff, operation, client, model_name): i 
                for i, client in enumerate(clients)
            }
            
            # as_completed yields futures as soon as they finish
            for future in concurrent.futures.as_completed(future_to_client):
                client_idx = future_to_client[future]
                try:
                    result = future.result()
                    print(f"  🏆 WINNER: Key {client_idx + 1} finished first!")
                    # Return immediately! The fastest response wins.
                    # Other threads will complete in the background and their results discarded.
                    return result
                except Exception as e:
                    err = str(e)
                    last_error = e
                    print(f"  ❌ Key {client_idx + 1} failed: {err[:120]}")
                    
                    if "404" in err:
                        print(f"  Model {model_name} unavailable. Trying next model...")
                        break # break the as_completed loop to switch to the next model

    raise ValueError(
        f"All {len(clients)} key(s) and {len(models_to_try)} model(s) failed. "
        f"Last error: {str(last_error)}"
    )