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
        system_prompt = """You are an elite frontend developer refining a web application based on reviewer feedback.
You have been given the previous version of the code and specific feedback from a code reviewer.

Your job is to:
1. Carefully read the feedback and fix ALL issues mentioned.
2. Keep everything that was already working correctly.
3. Improve the code based on the feedback.
4. Output ONLY valid JSON with keys: html_content, css_content, js_content.

The HTML must include <script src="https://cdn.tailwindcss.com"></script> in the <head>.
Write complete, functional code. No placeholders. No commentary."""

        contents = f"""PREVIOUS CODE:
{json.dumps(previous_code, indent=2)}

REVIEWER FEEDBACK:
{feedback}

Fix all issues mentioned above and return the improved code as JSON."""
    else:
        # First pass: generate from scratch
        system_prompt = """You are an elite frontend developer building a web application based on a user's prompt.
You must output ONLY valid JSON containing the following exactly three keys:
- html_content: The HTML code. It must include <script src="https://cdn.tailwindcss.com"></script> in the <head>.
- css_content: The custom CSS code (excluding Tailwind utility classes used in HTML).
- js_content: The custom JavaScript code.

Write complete, functional, and fully implemented code. Do not use placeholders like "// add logic here".
Prioritize speed, clean UI (dark mode with Tailwind), and immediate execution.

Output ONLY valid JSON. No markdown fences, no commentary."""
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
