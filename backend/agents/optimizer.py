from google import genai
from agents.client import with_key_rotation


def optimize_prompt(raw_prompt: str) -> str:
    system_prompt = """You are an elite product manager and UX designer. Your job is to take a vague, minimal app idea from a user and transform it into a detailed, actionable product specification for a frontend developer.

Your output must be a single, detailed paragraph (NOT JSON, just plain text) that describes:

1. **App Name**: A catchy, professional name for the app.
2. **Core Features**: 3-5 specific, well-defined features the app must have.
3. **UI/UX Details**: Describe the layout, color scheme (prefer dark mode with modern gradients), typography, and visual style. Mention specific UI patterns like cards, modals, sidebars, tabs, etc.
4. **Interactions**: Describe animations, hover effects, transitions, and micro-interactions that make the app feel premium.
5. **Data & State**: What data does the app manage? How does state flow? What happens on user actions?
6. **Edge Cases**: Mention empty states, error states, loading states, and validation.

Transform even the simplest idea into a rich, fully-fledged product concept. Think like you're writing a brief for a senior developer at a top tech company.

IMPORTANT: Your output is plain text only. Do NOT output JSON. Do NOT use markdown fences. Just write the enhanced prompt as a detailed paragraph."""

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
