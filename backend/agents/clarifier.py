import json
from google import genai
from agents.client import with_key_rotation
from pydantic import BaseModel

class ClarifyResponse(BaseModel):
    questions: list[str]

def generate_questions(prompt: str) -> list[str]:
    system_prompt = (
        "You are an expert product manager analyzing a user's brief app idea. "
        "Your goal is to extract EXACTLY 3 targeted, specific questions to clarify their requirements. "
        "For example, if they say 'portfolio', ask about their name, profession, and preferred color theme. "
        "Output ONLY valid JSON matching this schema: {'questions': ['Q1', 'Q2', 'Q3']}. "
        "No markdown, no preambles."
    )

    def _operation(client: genai.Client, model_name: str):
        response = client.models.generate_content(
            model=model_name,
            contents=f"Analyze this idea and return 3 clarification questions:\n\n{prompt}",
            config={
                "system_instruction": system_prompt,
                "response_mime_type": "application/json",
                "response_schema": ClarifyResponse,
            }
        )

        if not response.text:
            raise ValueError("Empty response from Gemini")
        
        try:
            data = json.loads(response.text)
            return data.get("questions", [])[:3] # Ensure max 3
        except json.JSONDecodeError:
            print("Failed to parse clarifier response")
            return []

    try:
        return with_key_rotation(_operation)
    except Exception as e:
        print(f"Clarifier failed: {str(e)}")
        return [] # Fallback to no questions if it fails

