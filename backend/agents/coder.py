import json
from google import genai
from pydantic import BaseModel
from utils import parse_response
from agents.client import with_key_rotation


class GenerateResponse(BaseModel):
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
        system_prompt = "You are a UI developer refining code based on feedback. Keep what works, fix ALL issues mentioned. Output ONLY JSON with keys: html_content (must include tailwind CDN), css_content, js_content. Complete code only, no placeholders."

        contents = f"PREVIOUS CODE:\n{json.dumps(previous_code)}\n\nFEEDBACK:\n{feedback}"
    else:
        # First pass: generate from scratch
        system_prompt = "You are a UI developer. Output ONLY valid JSON with keys: html_content (must include tailwind CDN), css_content, js_content. Code must be complete, functional, modern, and dark-themed. No placeholders."
        contents = prompt

    def _operation(client: genai.Client):
        response = client.models.generate_content(
            model='gemini-1.5-flash',
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
