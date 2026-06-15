from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.coding_interview import generate_problem, execute_code, review_code

router = APIRouter(prefix="/coding", tags=["Coding Interview"])


class GenerateProblemRequest(BaseModel):
    role: str = "the role"
    company_name: str = "the company"
    job_description: str = ""
    difficulty: str = "medium"  # easy | medium | hard


class ExecuteRequest(BaseModel):
    code: str
    language: str = "python"  # python | javascript | java | cpp
    stdin: str = ""


class ReviewRequest(BaseModel):
    problem_title: str
    problem_description: str
    code: str
    language: str = "python"
    execution_result: dict = {}
    transcript: str = ""


@router.post("/problem")
async def create_problem(request: GenerateProblemRequest):
    """Generate a role-targeted LeetCode-style coding problem."""
    try:
        problem = generate_problem(
            role=request.role,
            company_name=request.company_name,
            job_description=request.job_description,
            difficulty=request.difficulty,
        )
        return {"problem": problem, "status": "ready"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute")
async def run_code(request: ExecuteRequest):
    """Execute submitted code in the Piston sandbox."""
    try:
        result = await execute_code(
            code=request.code,
            language=request.language,
            stdin=request.stdin,
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/review")
async def review_submission(request: ReviewRequest):
    """Groq reviews the submitted solution and returns feedback + score."""
    try:
        feedback_text, score = review_code(
            problem_title=request.problem_title,
            problem_description=request.problem_description,
            code=request.code,
            language=request.language,
            execution_result=request.execution_result,
            transcript=request.transcript,
        )
        return {"feedback": feedback_text, "score": score, "status": "reviewed"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))