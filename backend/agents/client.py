import os
from pathlib import Path
from google import genai
from dotenv import load_dotenv

# Load .env.local from project root (two levels up from agents/)
env_path = Path(__file__).resolve().parent.parent.parent / ".env.local"
load_dotenv(dotenv_path=str(env_path))

def with_key_rotation(operation):
    keys = []
    if os.getenv("GEMINI_API_KEYS"):
        keys = [k.strip() for k in os.getenv("GEMINI_API_KEYS").split(",") if k.strip()]
    else:
        keys = [
            os.getenv("GEMINI_API_KEY"),
            os.getenv("GEMINI_API_KEY_2"),
            os.getenv("GEMINI_API_KEY_3"),
            os.getenv("GEMINI_API_KEY_4"),
            os.getenv("GEMINI_API_KEY_5")
        ]
        # Strip whitespace and filter empty keys
        keys = [k.strip() for k in keys if k and k.strip()]

    if not keys:
        raise ValueError("No Gemini API keys configured. Check your .env.local file.")

    last_error = None

    for i, key in enumerate(keys):
        try:
            print(f"Trying Key {i + 1}...")
            client = genai.Client(api_key=key)
            result = operation(client)
            print(f"Key {i + 1} succeeded!")
            return result
        except Exception as e:
            print(f"Attempt with Key {i + 1} failed: {str(e)}")
            last_error = e

    raise ValueError(f"All attempts across {len(keys)} API keys failed. Last error: {str(last_error)}")
