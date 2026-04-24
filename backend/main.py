import uuid
import os
import zipfile
import traceback
import base64
import tempfile
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from agents.client import with_key_rotation

from agents.coder import generate_code
from agents.critic import review_code
from agents.clarifier import generate_questions
from agents.architect import generate_backend

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI()
MAX_ITERATIONS = 1

# ── Directories ───────────────────────────────────────────────────────────────
BASE_DIR      = Path(__file__).resolve().parent
GENERATED_DIR = BASE_DIR / "generated"
ZIPS_DIR      = BASE_DIR / "zips"
GENERATED_DIR.mkdir(parents=True, exist_ok=True)
ZIPS_DIR.mkdir(parents=True, exist_ok=True)

# Mount static dirs BEFORE middleware
app.mount("/generated", StaticFiles(directory=str(GENERATED_DIR), html=True), name="generated")
app.mount("/zips",      StaticFiles(directory=str(ZIPS_DIR)),                 name="zips")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────
def get_base_url() -> str:
    """Set NGROK_URL=https://xxx.ngrok-free.app in .env.local for public links."""
    return os.getenv("NGROK_URL", "http://localhost:8000").rstrip("/")


def build_full_html(html: str, css: str, js: str) -> str:
    """Merges html/css/js into one self-contained HTML file."""
    if "<html" in html.lower():
        if "</head>" in html:
            html = html.replace("</head>", f"<style>\n{css}\n</style>\n</head>", 1)
        else:
            html = f"<style>\n{css}\n</style>\n" + html
        if "</body>" in html:
            html = html.replace("</body>", f"<script>\n{js}\n</script>\n</body>", 1)
        else:
            html += f"\n<script>\n{js}\n</script>"
        return html
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Generated App</title>
  <style>
{css}
  </style>
</head>
<body>
{html}
  <script>
{js}
  </script>
</body>
</html>"""


def save_frontend(app_id: str, html: str, css: str, js: str) -> str:
    """Saves merged index.html and returns live URL."""
    app_dir = GENERATED_DIR / app_id
    app_dir.mkdir(parents=True, exist_ok=True)
    (app_dir / "index.html").write_text(build_full_html(html, css, js), encoding="utf-8")
    url = f"{get_base_url()}/generated/{app_id}/index.html"
    print(f"🌐 Frontend → {url}")
    return url


def build_zip(app_id: str, html: str, css: str, js: str, backend: dict) -> str:
    """
    Zips frontend + backend into /zips/<app_id>.zip and returns download URL.
    Structure:
      frontend/index.html, style.css, script.js
      backend/main.py, models.py, requirements.txt, schema.sql
      README.md
    """
    zip_path = ZIPS_DIR / f"{app_id}.zip"

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        # Frontend
        zf.writestr("frontend/index.html", build_full_html(html, css, js))
        zf.writestr("frontend/style.css",  css)
        zf.writestr("frontend/script.js",  js)

        # Backend
        zf.writestr("backend/main.py",          backend.get("backend_main", ""))
        zf.writestr("backend/models.py",         backend.get("backend_models", ""))
        zf.writestr("backend/requirements.txt",  backend.get("backend_requirements", ""))
        zf.writestr("backend/schema.sql",        backend.get("db_schema_sql", ""))

        # README
        readme = f"""# Generated Full-Stack App

## Setup
{backend.get("setup_instructions", "")}

## Structure
```
frontend/
  index.html     - Open in browser
  style.css
  script.js

backend/
  main.py        - FastAPI server (run this)
  models.py      - SQLAlchemy + SQLite models
  requirements.txt
  schema.sql     - DB schema reference
```

## Quick Start
```bash
cd backend
pip install -r requirements.txt
python main.py
```
Then open frontend/index.html in your browser.
"""
        zf.writestr("README.md", readme)

    url = f"{get_base_url()}/zips/{app_id}.zip"
    print(f"📦 ZIP → {url}")
    return url


# ── Request models ────────────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    prompt: str

class ClarifyRequest(BaseModel):
    prompt: str

class RefineRequest(BaseModel):
    feedback: str
    html_content: str
    css_content: str
    js_content: str
    optimized_prompt: str


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def health():
    return {"status": "ok", "message": "WebGen API is running"}


@app.post("/api/clarify")
def clarify(req: ClarifyRequest):
    if not req.prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    try:
        print("=" * 60)
        print("Clarifier Agent — generating questions...")
        questions = generate_questions(req.prompt)
        print(f"Generated {len(questions)} questions.")
        return {"questions": questions}
    except Exception as e:
        print(f"Clarify Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate")
def generate(req: GenerateRequest):
    if not req.prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    try:
        app_id = str(uuid.uuid4())[:8]

        # ── Step 1: Coder ─────────────────────────────────────────────────────
        print("=" * 60)
        print(f"[{app_id}] Step 1: Coder Agent — generating code...")
        current_code = generate_code(req.prompt)
        optimized_prompt = current_code.get("optimized_prompt", req.prompt)

        # ── Step 2: Critic ────────────────────────────────────────────────────
        review_log = []
        for iteration in range(1, MAX_ITERATIONS + 1):
            print(f"[{app_id}] Step 2.{iteration}: Critic Agent — reviewing (round {iteration}/{MAX_ITERATIONS})...")
            review = review_code(current_code, iteration)
            approved = review.get("approved", True)
            feedback = review.get("feedback", "")

            review_log.append({
                "round": iteration,
                "approved": approved,
                "feedback": feedback,
            })

            current_code = {
                "html_content": review.get("fixed_html_content", current_code.get("html_content", "")),
                "css_content":  review.get("fixed_css_content",  current_code.get("css_content", "")),
                "js_content":   review.get("fixed_js_content",   current_code.get("js_content", "")),
            }

            if approved:
                print(f"[{app_id}] ✅ Critic APPROVED on round {iteration}!")
                break
            else:
                print(f"[{app_id}] ❌ Critic rejected: {feedback[:100]}...")
                if iteration < MAX_ITERATIONS:
                    current_code = generate_code(
                        prompt=optimized_prompt,
                        feedback=feedback,
                        previous_code=current_code,
                    )
                else:
                    print(f"[{app_id}] ⚠️  Max iterations reached. Using critic's fixed code.")

        html = current_code.get("html_content", "")
        css  = current_code.get("css_content", "")
        js   = current_code.get("js_content", "")

        # ── Step 3: Save frontend + live URL ──────────────────────────────────
        live_url = save_frontend(app_id, html, css, js)

        # ── Step 4: Architect generates backend ───────────────────────────────
        print(f"[{app_id}] Step 3: Architect Agent — generating backend...")
        backend = generate_backend(
            optimized_prompt=optimized_prompt,
            html_content=html,
            js_content=js,
        )

        # ── Step 5: Build ZIP ─────────────────────────────────────────────────
        print(f"[{app_id}] Step 4: Building project.zip...")
        download_url = build_zip(app_id, html, css, js, backend)

        print("=" * 60)
        print(f"[{app_id}] Done! Total API calls: {1 + len(review_log) + 1}")

        return {
            **current_code,
            "optimized_prompt":     optimized_prompt,
            "review_log":           review_log,
            "total_iterations":     len(review_log),
            "app_id":               app_id,
            "live_url":             live_url,
            "download_url":         download_url,
            "backend_main":         backend.get("backend_main", ""),
            "backend_models":       backend.get("backend_models", ""),
            "backend_requirements": backend.get("backend_requirements", ""),
            "setup_instructions":   backend.get("setup_instructions", ""),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/refine")
def refine(req: RefineRequest):
    if not req.feedback:
        raise HTTPException(status_code=400, detail="Feedback is required")

    try:
        app_id = str(uuid.uuid4())[:8]
        print("=" * 60)
        print(f"[{app_id}] Step 1: Coder Agent — refining code based on user feedback...")
        
        previous_code = {
            "html_content": req.html_content,
            "css_content": req.css_content,
            "js_content": req.js_content
        }

        current_code = generate_code(
            prompt=req.optimized_prompt, 
            feedback=req.feedback, 
            previous_code=previous_code
        )
        
        optimized_prompt = req.optimized_prompt

        # ── Step 2: Critic ────────────────────────────────────────────────────
        review_log = []
        for iteration in range(1, MAX_ITERATIONS + 1):
            print(f"[{app_id}] Step 2.{iteration}: Critic Agent — reviewing (round {iteration}/{MAX_ITERATIONS})...")
            review = review_code(current_code, iteration)
            approved = review.get("approved", True)
            feedback = review.get("feedback", "")

            review_log.append({
                "round": iteration,
                "approved": approved,
                "feedback": feedback,
            })

            current_code = {
                "html_content": review.get("fixed_html_content", current_code.get("html_content", "")),
                "css_content":  review.get("fixed_css_content",  current_code.get("css_content", "")),
                "js_content":   review.get("fixed_js_content",   current_code.get("js_content", "")),
            }

            if approved:
                print(f"[{app_id}] ✅ Critic APPROVED on round {iteration}!")
                break
            else:
                print(f"[{app_id}] ❌ Critic rejected: {feedback[:100]}...")
                if iteration < MAX_ITERATIONS:
                    current_code = generate_code(
                        prompt=optimized_prompt,
                        feedback=feedback,
                        previous_code=current_code,
                    )
                else:
                    print(f"[{app_id}] ⚠️  Max iterations reached. Using critic's fixed code.")

        html = current_code.get("html_content", "")
        css  = current_code.get("css_content", "")
        js   = current_code.get("js_content", "")

        # ── Step 3: Save frontend + live URL ──────────────────────────────────
        live_url = save_frontend(app_id, html, css, js)

        # ── Step 4: Architect generates backend ───────────────────────────────
        print(f"[{app_id}] Step 3: Architect Agent — generating backend...")
        backend = generate_backend(
            optimized_prompt=optimized_prompt,
            html_content=html,
            js_content=js,
        )

        # ── Step 5: Build ZIP ─────────────────────────────────────────────────
        print(f"[{app_id}] Step 4: Building project.zip...")
        download_url = build_zip(app_id, html, css, js, backend)

        print("=" * 60)
        print(f"[{app_id}] Done! Total API calls: {1 + len(review_log) + 1}")

        return {
            **current_code,
            "optimized_prompt":     optimized_prompt,
            "review_log":           review_log,
            "total_iterations":     len(review_log),
            "app_id":               app_id,
            "live_url":             live_url,
            "download_url":         download_url,
            "backend_main":         backend.get("backend_main", ""),
            "backend_models":       backend.get("backend_models", ""),
            "backend_requirements": backend.get("backend_requirements", ""),
            "setup_instructions":   backend.get("setup_instructions", ""),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Direct ZIP download route ─────────────────────────────────────────────────
@app.get("/api/download/{app_id}")
def download(app_id: str):
    zip_path = ZIPS_DIR / f"{app_id}.zip"
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    return FileResponse(
        path=str(zip_path),
        media_type="application/zip",
        filename=f"project-{app_id}.zip",
    )

# ── List Projects route ───────────────────────────────────────────────────────
@app.get("/api/projects")
def list_projects():
    projects = []
    if GENERATED_DIR.exists():
        for d in GENERATED_DIR.iterdir():
            if d.is_dir() and (d / "index.html").exists():
                projects.append({
                    "id": d.name,
                    "url": f"{get_base_url()}/generated/{d.name}/index.html",
                    "download_url": f"{get_base_url()}/zips/{d.name}.zip"
                })
    return {"projects": projects}


# ── Speech-to-Text route ──────────────────────────────────────────────────────
@app.post("/api/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Receives audio from the browser MediaRecorder and uses Gemini to transcribe it."""
    try:
        audio_bytes = await audio.read()
        if len(audio_bytes) < 100:
            raise HTTPException(status_code=400, detail="Audio too short")

        # Detect mime type
        content_type = audio.content_type or "audio/webm"
        if "webm" in content_type:
            mime = "audio/webm"
        elif "ogg" in content_type:
            mime = "audio/ogg"
        elif "wav" in content_type:
            mime = "audio/wav"
        else:
            mime = "audio/webm"

        # Encode as base64 for inline Gemini request (no file upload needed)
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        def do_transcribe(client, model_name):
            from google.genai import types as genai_types
            response = client.models.generate_content(
                model=model_name,
                contents=[
                    genai_types.Content(
                        parts=[
                            genai_types.Part(text=(
                                "Transcribe the following audio exactly as spoken. "
                                "Return ONLY the raw transcription text, nothing else. "
                                "No quotes, no labels, no explanations."
                            )),
                            genai_types.Part(
                                inline_data=genai_types.Blob(
                                    mime_type=mime,
                                    data=audio_b64,
                                )
                            ),
                        ]
                    )
                ],
            )
            return response.text.strip()

        transcript = with_key_rotation(do_transcribe)
        print(f"🎤 Transcribed: {transcript[:80]}")
        return {"transcript": transcript}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[TRANSCRIBE ERROR] {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))