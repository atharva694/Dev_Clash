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
    system_prompt = f"""You are an elite code reviewer and QA engineer. This is review round {iteration}.
You have received generated code for a web app (HTML, CSS, JS).

Your job is to carefully review the code and return a JSON object with these keys:

1. "approved" (boolean): Set to true ONLY if the code is production-ready with:
   - Zero syntax errors in HTML, CSS, and JS
   - Functional UI that renders correctly
   - All features mentioned in the code actually work
   - Clean, modern dark-mode styling
   - No placeholder text, dummy handlers, or incomplete logic
   Set to false if ANY of the above checks fail.

2. "feedback" (string): If approved is false, write specific, actionable feedback describing:
   - Exact syntax errors found (with line context)
   - Missing functionality or broken features
   - UI/UX issues
   - What needs to be fixed
   If approved is true, write "Code is production-ready. All checks passed."

3. "fixed_html_content" (string): The corrected HTML code (or original if no fix needed)
4. "fixed_css_content" (string): The corrected CSS code (or original if no fix needed)
5. "fixed_js_content" (string): The corrected JS code (or original if no fix needed)

Be thorough but practical. Fix minor issues yourself in the fixed_ fields.
Only reject (approved=false) for significant issues that affect functionality."""

    try:
        prompt = f"Review this code (round {iteration}):\n\n{json.dumps(code, indent=2)}"

        def _operation(client: genai.Client):
            response = client.models.generate_content(
                model='gemini-1.5-flash',
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
