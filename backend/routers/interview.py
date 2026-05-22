from fastapi import FastAPI, HTTPException
from fastapi import APIRouter
from pydantic import BaseModel
from core.database import create_session, save_question, complete_session, get_session_results
from core.vector_store import store_job_context
from agents.scrapper import run_research
from agents.question_generator import generate_questions
from agents.feedback_engine import get_feedback

router = APIRouter(prefix="/interview", tags=["Interview"])

class StartSessionRequest(BaseModel):
    company_name: str
    role: str
    job_description: str
    company_context: str = ""
    
class AnswerRequest(BaseModel):
    session_id: int
    question: str
    answer: str
    company_name: str
    role: str
    
@router.post("/start")
async def start_session(request: StartSessionRequest):
    """Start a new interview session"""
    try:
        # Create session in DB
        session_id = create_session(request.company_name, request.role)
        print(f"✅ Session created: {session_id}")

        # Store job context in vector DB
        store_job_context(
            session_id,
            request.job_description,
            request.company_context
        )
        print(f"✅ Job context stored")

        # Scrape web for real interview data
        research_summary = await run_research(
            session_id,
            request.company_name,
            request.role
        )
        print(f"✅ Research done: {research_summary}")

        # Generate targeted questions
        questions_text = generate_questions(
            session_id,
            request.company_name,
            request.role,
            request.job_description
        )
        print(f"✅ Questions generated")

        return {
            "session_id": session_id,
            "research_summary": research_summary,
            "questions_raw": questions_text,
            "status": "ready"
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/answer")
async def submit_answer(request: AnswerRequest):
    """Submit an answer to a question"""
    try:
        feedback_text, score = get_feedback(
            request.question,
            request.answer,
            request.company_name,
            request.role
        )
        
        save_question(
            request.session_id,
            request.question,
            request.answer,
            score,
            feedback_text
        )
        
        return{
            "feedback": feedback_text,
            "score": score,
            "status": "saved"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/session/{session_id}")
async def get_session(session_id):
    """Get results for a session"""
    try:
        return get_session_results(session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.post("/session/{session_id}/complete")
async def finish_session(session_id: int):
    complete_session(session_id)
    return {"status": "session completed"}