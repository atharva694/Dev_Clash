import json
from google import genai
from pydantic import BaseModel
from utils import parse_response
from agents.client import with_key_rotation


class GenerateResponse(BaseModel):
    optimized_prompt: str
    html_content: str
    css_content: str
    js_content: str


def generate_code(prompt: str, feedback: str = None, previous_code: dict = None) -> dict:
    """
    Generates code from a prompt. Optionally accepts critic feedback and
    previous code to refine the output in subsequent iterations.
    """
    if feedback and previous_code:
        # Refinement mode: Coder gets the previous code + critic's feedback
        system_prompt = "You are a UI developer refining code based on feedback. Keep what works, fix ALL issues mentioned. Output ONLY JSON with keys: optimized_prompt, html_content (must include tailwind CDN), css_content, js_content. Complete code only, no placeholders."

        contents = f"PREVIOUS CODE:\n{json.dumps(previous_code)}\n\nFEEDBACK:\n{feedback}"
    else:
        # First pass: generate from scratch
        system_prompt = "Act as a PM and UI developer. First, expand the user's brief idea into a 1-paragraph technical spec. Then, build it. Output ONLY valid JSON with keys: optimized_prompt (your detailed spec), html_content (must include tailwind CDN), css_content, js_content. Code must be complete, functional, modern, and dark-themed. No placeholders."
        contents = prompt

    def _operation(client: genai.Client, model_name: str):
        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config={
                "system_instruction": system_prompt,
                "response_mime_type": "application/json",
                "response_schema": GenerateResponse,
            }
        )

        if not response.text:
            raise ValueError("No response from Gemini")

        return parse_response(response.text)

    return with_key_rotation(_operation)
