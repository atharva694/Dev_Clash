from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents.coder import generate_code
from agents.critic import review_code

app = FastAPI()

MAX_ITERATIONS = 3  # Maximum Coder-Critic refinement rounds

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    prompt: str

@app.post("/api/generate")
def generate(req: GenerateRequest):
    if not req.prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    try:
        # Step 1: Coder Agent generates optimized prompt AND initial code in one request
        print("=" * 60)
        print("Step 1: Coder Agent — optimizing prompt & generating initial code...")
        current_code = generate_code(req.prompt)
        
        # Extract the optimized prompt from the response
        optimized_prompt = current_code.get("optimized_prompt", req.prompt)

        # Step 2: Iterative Coder-Critic refinement loop
        review_log = []

        for iteration in range(1, MAX_ITERATIONS + 1):
            print("-" * 60)
            print(f"Step 2.{iteration}: Critic Agent — reviewing (round {iteration}/{MAX_ITERATIONS})...")

            review = review_code(current_code, iteration)
            approved = review.get("approved", True)
            feedback = review.get("feedback", "")

            review_log.append({
                "round": iteration,
                "approved": approved,
                "feedback": feedback,
            })

            # Apply critic's fixes regardless of approval
            current_code = {
                "html_content": review.get("fixed_html_content", current_code.get("html_content", "")),
                "css_content": review.get("fixed_css_content", current_code.get("css_content", "")),
                "js_content": review.get("fixed_js_content", current_code.get("js_content", "")),
            }

            if approved:
                print(f"✅ Critic APPROVED on round {iteration}!")
                break
            else:
                print(f"❌ Critic REJECTED on round {iteration}: {feedback[:100]}...")

                if iteration < MAX_ITERATIONS:
                    # Send feedback back to the Coder for refinement
                    print(f"   Sending feedback to Coder for round {iteration + 1}...")
                    current_code = generate_code(
                        prompt=optimized_prompt,
                        feedback=feedback,
                        previous_code=current_code,
                    )
                else:
                    print(f"⚠️  Max iterations ({MAX_ITERATIONS}) reached. Using best available code.")

        print("=" * 60)
        print(f"Done! Returning code after {len(review_log)} review round(s).")

        return {
            **current_code,
            "optimized_prompt": optimized_prompt,
            "review_log": review_log,
            "total_iterations": len(review_log),
        }
    except Exception as e:
        print(f"API Route Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
