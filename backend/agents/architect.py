from google import genai
from pydantic import BaseModel
from utils import parse_response
from agents.client import with_key_rotation


class ArchitectResponse(BaseModel):
    backend_main: str       # FastAPI main.py content
    backend_models: str     # SQLAlchemy models.py content
    backend_requirements: str  # requirements.txt content
    db_schema_sql: str      # Raw SQL CREATE TABLE statements (for reference)
    setup_instructions: str # How to run the backend


_SYSTEM_ARCHITECT = """You are a senior backend architect. Given a frontend web app spec and its HTML/JS, 
generate a complete, fully working FastAPI backend that powers it.

Rules:
- Use SQLite with SQLAlchemy (no alembic needed, use Base.metadata.create_all)
- All endpoints must match what the frontend JS fetch() calls expect
- Use CORS middleware allowing all origins
- Keep it simple and runnable with just: pip install -r requirements.txt && python main.py
- Database file should be named app.db in the same directory
- Include proper Pydantic request/response models
- All routes must be prefixed with /api
- If the app spec requires Machine Learning (e.g. clustering, classification, predictions), you MUST use `scikit-learn` and generate a simple, working mock model in `main.py` (e.g., train a quick model on dummy data on startup) and expose a prediction endpoint. Add `scikit-learn`, `numpy`, and `pandas` to `requirements.txt`.
- No placeholders — generate complete, working code only

Output JSON with these exact keys:
- backend_main: complete FastAPI main.py as a string
- backend_models: complete models.py with SQLAlchemy models as a string  
- backend_requirements: requirements.txt content as a string
- db_schema_sql: raw SQL CREATE TABLE statements as a string
- setup_instructions: short string explaining how to run (pip install + python main.py)
"""


def generate_backend(optimized_prompt: str, html_content: str, js_content: str) -> dict:
    """
    Generates a full FastAPI backend + SQLite schema to match the frontend.
    Takes the optimized prompt and frontend code as context.
    """
    contents = f"""
APP SPEC:
{optimized_prompt}

FRONTEND HTML (shows UI structure and what data is needed):
{html_content[:3000]}

FRONTEND JAVASCRIPT (shows what API endpoints are called):
{js_content[:3000]}

Generate a complete FastAPI backend with SQLite that serves this frontend perfectly.
All fetch() calls in the JS must have matching API endpoints.
"""

    def _operation(client: genai.Client, model_name: str):
        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config={
                "system_instruction": _SYSTEM_ARCHITECT,
                "response_mime_type": "application/json",
                "response_schema": ArchitectResponse,
            }
        )
        if not response.text:
            raise ValueError("Empty response from Gemini")
        return parse_response(response.text)

    return with_key_rotation(_operation)