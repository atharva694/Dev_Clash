import json
import re

def extract_json_from_markdown(text: str) -> str:
    # Try to find JSON inside markdown fences
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1)
    return text

def parse_response(text: str) -> dict:
    try:
        clean_json = extract_json_from_markdown(text)
        return json.loads(clean_json)
    except Exception as e:
        print(f"Failed to parse JSON: {text}")
        raise ValueError("Invalid JSON format from AI")
