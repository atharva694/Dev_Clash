from google import genai
from agents.client import with_key_rotation


def optimize_prompt(raw_prompt: str) -> str:
    system_prompt = "Act as a PM. Expand the user's brief idea into a 1-paragraph technical spec covering: App Name, 3-4 core features, UI/UX (dark mode, layout), and state logic. Plain text only, no markdown."

    def _operation(client: genai.Client):
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=f"Enhance this app idea into a detailed product spec:\n\n{raw_prompt}",
            config={
                "system_instruction": system_prompt,
            }
        )

        if not response.text:
            raise ValueError("No response from Gemini Optimizer")

        return response.text.strip()

    try:
        optimized = with_key_rotation(_operation)
        print(f"Optimized prompt ({len(raw_prompt)} → {len(optimized)} chars)")
        return optimized
    except Exception as e:
        print(f"Prompt Optimizer failed, using raw prompt: {str(e)}")
        return raw_prompt  # Fallback to raw prompt if optimizer fails
