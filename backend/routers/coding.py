from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.coding_interview import generate_problem, execute_code, review_code
from core.database import create_session, save_coding_question, get_coding_session_results
import json

router = APIRouter(prefix="/coding", tags=["Coding Interview"])

class StartCodingSessionRequest(BaseModel):
    role: str = "the role"
    company_name: str = "the company"
    
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

@router.post("/session/start")
async def start_coding_session(request: StartCodingSessionRequest):
    "Create new coding session, return session ID."
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
        
        save_coding_question(
            session_id=1,
            problem_title=request.problem_title,
            problem_description=request.problem_description,
            difficulty="medium",
            language=request.language,
            code=request.code,
            execution_result=json.dumps(request.execution_result),
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
    
    try:
        return get_coding_session_results(session_id)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))