import os
from pathlib import Path
from google import genai
from dotenv import load_dotenv

# Load .env.local from project root (two levels up from agents/)
env_path = Path(__file__).resolve().parent.parent.parent / ".env.local"
load_dotenv(dotenv_path=str(env_path))

def with_key_rotation(operation, preferred_model="gemini-2.0-flash"):
    keys = []
    if os.getenv("GEMINI_API_KEYS"):
        keys = [k.strip() for k in os.getenv("GEMINI_API_KEYS").split(",") if k.strip()]
    else:
        keys = [
            os.getenv("GEMINI_API_KEY"),
            os.getenv("GEMINI_API_KEY_2"),
            os.getenv("GEMINI_API_KEY_3"),
            os.getenv("GEMINI_API_KEY_4"),
            os.getenv("GEMINI_API_KEY_5"),
            os.getenv("GEMINI_API_KEY_6"),
            os.getenv("GEMINI_API_KEY_7"),
            os.getenv("GEMINI_API_KEY_8"),
            os.getenv("GEMINI_API_KEY_9"),
        ]
        # Strip whitespace and filter empty keys
        keys = [k.strip() for k in keys if k and k.strip()]

    if not keys:
        raise ValueError("No Gemini API keys configured. Check your .env.local file.")

    # List of models to try in order of fallback
    models_to_try = [
        preferred_model,
        "gemini-3.1-pro-preview",
        "gemini-2.5-flash"
    ]
    # Ensure preferred model is first, avoid duplicates
    models_to_try = list(dict.fromkeys(models_to_try))

    last_error = None

    for model_name in models_to_try:
        print(f"\n--- Attempting with model: {model_name} ---")
        for i, key in enumerate(keys):
            try:
                print(f"  Trying Key {i + 1}...")
                client = genai.Client(api_key=key)
                # Pass the dynamically selected model to the operation
                result = operation(client, model_name)
                print(f"  ✅ Key {i + 1} with {model_name} succeeded!")
                return result
            except Exception as e:
                print(f"  ❌ Key {i + 1} failed: {str(e)}")
                last_error = e
                # If the error is 404 (model not found), break key loop and try next model
                if "404" in str(e):
                    print(f"  Model {model_name} not supported by this key. Switching model...")
                    break 

    raise ValueError(f"All attempts across {len(keys)} API keys and {len(models_to_try)} models failed. Last error: {str(last_error)}")
