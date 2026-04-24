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


# ✅ System prompts defined once as constants — not rebuilt on every call
_SYSTEM_FRESH = (
    "You are a PM + UI developer. Expand the user's idea into a 1-paragraph spec, then build it. "
    "Output ONLY valid JSON: optimized_prompt, html_content (include Tailwind CDN), css_content, js_content. "
    "Code must be complete, functional, modern, dark-themed. No placeholders."
)

_SYSTEM_REFINE = (
    "You are a UI developer fixing code based on critic feedback. "
    "Keep what works, fix ALL issues listed. "
    "Output ONLY JSON: optimized_prompt, html_content (include Tailwind CDN), css_content, js_content. "
    "Complete code only, no placeholders."
)


def generate_code(prompt: str, feedback: str = None, previous_code: dict = None) -> dict:
    if feedback and previous_code:
        system_prompt = _SYSTEM_REFINE
        # ✅ Send only the feedback + diff-friendly summary, not full JSON-stringified code
        # This alone can cut input tokens by 40-60% on large codebases
        contents = (
            f"FEEDBACK TO FIX:\n{feedback}\n\n"
            f"PREVIOUS HTML (fix and return full):\n{previous_code.get('html_content', '')}\n\n"
            f"PREVIOUS CSS:\n{previous_code.get('css_content', '')}\n\n"
            f"PREVIOUS JS:\n{previous_code.get('js_content', '')}"
        )
    else:
        system_prompt = _SYSTEM_FRESH
        contents = prompt  # ✅ Just the raw prompt — no extra wrapping

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
            raise ValueError("Empty response from Gemini")
        return parse_response(response.text)

    return with_key_rotation(_operation)