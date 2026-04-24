from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents.coder import generate_code
from agents.critic import review_code
from agents.clarifier import generate_questions

app = FastAPI()

# ✅ Reduced from 3 to 1 — critic+coder in one tight loop saves ~4 API calls per request
MAX_ITERATIONS = 1

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    prompt: str

class ClarifyRequest(BaseModel):
    prompt: str

@app.post("/api/clarify")
def clarify(req: ClarifyRequest):
    if not req.prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    try:
        print("=" * 60)
        print("Clarifier Agent — generating questions...")
        questions = generate_questions(req.prompt)
        print(f"Generated {len(questions)} questions.")
        return {"questions": questions}
    except Exception as e:
        print(f"API Route Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate")
def generate(req: GenerateRequest):
    if not req.prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    try:
        # Step 1: Coder generates optimized prompt + code (1 API call)
        print("=" * 60)
        print("Step 1: Coder Agent — optimizing prompt & generating code...")
        current_code = generate_code(req.prompt)
        optimized_prompt = current_code.get("optimized_prompt", req.prompt)

        # Step 2: Single critic pass — reviews AND fixes in one call
        review_log = []

        for iteration in range(1, MAX_ITERATIONS + 1):
            print(f"Step 2.{iteration}: Critic Agent — reviewing (round {iteration}/{MAX_ITERATIONS})...")

            review = review_code(current_code, iteration)
            approved = review.get("approved", True)
            feedback = review.get("feedback", "")

            review_log.append({
                "round": iteration,
                "approved": approved,
                "feedback": feedback,
            })

            # Always use critic's fixed code (it self-corrects minor issues inline)
            current_code = {
                "html_content": review.get("fixed_html_content", current_code.get("html_content", "")),
                "css_content": review.get("fixed_css_content", current_code.get("css_content", "")),
                "js_content": review.get("fixed_js_content", current_code.get("js_content", "")),
            }

            if approved:
                print(f"✅ Critic APPROVED on round {iteration}!")
                break
            else:
                print(f"❌ Critic rejected on round {iteration}: {feedback[:100]}...")
                if iteration < MAX_ITERATIONS:
                    print(f"   Sending feedback to Coder for round {iteration + 1}...")
                    current_code = generate_code(
                        prompt=optimized_prompt,
                        feedback=feedback,
                        previous_code=current_code,
                    )
                else:
                    print(f"⚠️  Max iterations ({MAX_ITERATIONS}) reached. Using critic's fixed code.")

        print("=" * 60)
        print(f"Done! {len(review_log)} review round(s). Total API calls: {1 + len(review_log)}")

        return {
            **current_code,
            "optimized_prompt": optimized_prompt,
            "review_log": review_log,
            "total_iterations": len(review_log),
        }
    except Exception as e:
        print(f"API Route Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))