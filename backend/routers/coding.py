from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.coding_interview import generate_problem, review_code
from core.database import create_session, save_coding_question, get_coding_session_results

router = APIRouter(prefix="/coding", tags=["Coding Interview"])


class StartCodingSessionRequest(BaseModel):
    role: str = "the role"
    company_name: str = "the company"


class GenerateProblemRequest(BaseModel):
    role: str = "the role"
    company_name: str = "the company"
    job_description: str = ""
    difficulty: str = "medium"


class ReviewRequest(BaseModel):
    session_id: int = 1
    problem_title: str
    problem_description: str
    difficulty: str = "medium"
    code: str
    language: str = "python"
    transcript: str = ""


@router.post("/session/start")
async def start_coding_session(request: StartCodingSessionRequest):
    """Create a new coding session, return session ID."""
    try:
        session_id = create_session(
            request.company_name,
            request.role,
            session_type="coding"
        )
        return {"session_id": session_id, "status": "ready"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


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


@router.post("/review")
async def review_submission(request: ReviewRequest):
    """Groq reviews the submitted solution and returns feedback + score."""
    try:
        feedback_text, score = review_code(
            problem_title=request.problem_title,
            problem_description=request.problem_description,
            code=request.code,
            language=request.language,
            transcript=request.transcript,
        )

        save_coding_question(
            session_id=request.session_id,
            problem_title=request.problem_title,
            problem_description=request.problem_description,
            difficulty=request.difficulty,
            language=request.language,
            code=request.code,
            execution_result="{}",
            score=score,
            feedback=feedback_text,
        )

        return {"feedback": feedback_text, "score": score, "status": "reviewed"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}")
async def get_coding_session(session_id: int):
    """Get full results for a coding session."""
    try:
        return get_coding_session_results(session_id)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))