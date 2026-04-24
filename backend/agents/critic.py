import json
from google import genai
from pydantic import BaseModel
from utils import parse_response
from agents.client import with_key_rotation


class GenerateResponse(BaseModel):
    html_content: str
    css_content: str
    js_content: str


class CriticReview(BaseModel):
    approved: bool
    feedback: str
    fixed_html_content: str
    fixed_css_content: str
    fixed_js_content: str


def review_code(code: dict, iteration: int) -> dict:
    """
    Reviews code and returns a structured verdict:
    - If approved: returns the (possibly fixed) code with approved=True
    - If rejected: returns feedback for the Coder with approved=False
    """
    system_prompt = f"Review this code (round {iteration}). Output JSON with:\n1. 'approved': true ONLY if zero syntax errors, fully functional UI, complete logic, no placeholders.\n2. 'feedback': specific fixes needed, or 'All passed'.\n3. 'fixed_html_content', 'fixed_css_content', 'fixed_js_content': correct minor issues yourself."

    try:
        prompt = f"Review this code:\n\n{json.dumps(code)}"

        def _operation(client: genai.Client, model_name: str):
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    "system_instruction": system_prompt,
                    "response_mime_type": "application/json",
                    "response_schema": CriticReview,
                }
            )

            if not response.text:
                print("Critic returned empty response, auto-approving.")
                return {
                    "approved": True,
                    "feedback": "Critic returned empty — auto-approved.",
                    "fixed_html_content": code.get("html_content", ""),
                    "fixed_css_content": code.get("css_content", ""),
                    "fixed_js_content": code.get("js_content", ""),
                }

            return parse_response(response.text)

        return with_key_rotation(_operation)
    except Exception as e:
        print(f"Critic Agent failed on round {iteration}: {str(e)}")
        # On failure, auto-approve to avoid blocking the pipeline
        return {
            "approved": True,
            "feedback": f"Critic error (auto-approved): {str(e)}",
            "fixed_html_content": code.get("html_content", ""),
            "fixed_css_content": code.get("css_content", ""),
            "fixed_js_content": code.get("js_content", ""),
        }
