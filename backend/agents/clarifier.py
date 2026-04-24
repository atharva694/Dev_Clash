import json
from google import genai
from agents.client import with_key_rotation
from pydantic import BaseModel

class ClarifyResponse(BaseModel):
    questions: list[str]

def generate_questions(prompt: str) -> list[str]:
    system_prompt = (
        "You are an expert product manager analyzing a user's brief web app idea. "
        "Your goal is to extract 3 to 5 highly specific, targeted questions to clarify missing "
        "requirements necessary to build a complete application. "
        "CRITICAL RULE 1: The user is non-technical. DO NOT use technical jargon (like API, endpoints, DB schema, auth providers). "
        "Phrase every question in simple, everyday language. "
        "CRITICAL RULE 2: If the user is asking for a 'portfolio', 'resume', or 'personal site', you MUST include a specific question asking them to provide a URL link to their profile photo or avatar so it can be displayed prominently on the website. "
        "For example, if they say 'portfolio', ask 'What is your name?', 'Please provide a URL to your profile photo', and 'What projects do you want to show off?'. "
        "If they say 'calculator', ask 'Do you need advanced math like sin/cos, or just basic plus and minus?'. "
        "Output ONLY valid JSON matching this schema: {'questions': ['Q1', 'Q2', ...]}."
    )

    def _operation(client: genai.Client, model_name: str):
        response = client.models.generate_content(
            model=model_name,
            contents=f"Analyze this web app idea and return 3 to 5 specific clarification questions:\n\n{prompt}",
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
            return data.get("questions", [])[:6] # Cap at 6 questions max
        except json.JSONDecodeError:
            print("Failed to parse clarifier response")
            return []

    try:
        return with_key_rotation(_operation)
    except Exception as e:
        print(f"Clarifier failed: {str(e)}")
        return [] # Fallback to no questions if it fails

