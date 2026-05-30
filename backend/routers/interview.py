from fastapi import FastAPI, HTTPException
from fastapi import APIRouter
from pydantic import BaseModel
from core.database import create_session, save_question, complete_session, get_session_results
from core.vector_store import store_job_context
from agents.scrapper import run_research
from agents.question_generator import generate_questions
from agents.feedback_engine import get_feedback
from fastapi import APIRouter, HTTPException, UploadFile, File
import tempfile
import os
import whisper
import edge_tts
from fastapi.responses import StreamingResponse
import io

router = APIRouter(prefix="/interview", tags=["Interview"])

class StartSessionRequest(BaseModel):
    company_name: str
    role: str
    job_description: str
    company_context: str = ""
    num_questions: int = 5
    
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
        print(f"Session created: {session_id}")

        # Store job context in vector DB
        store_job_context(
            session_id,
            request.job_description,
            request.company_context
        )
        print(f"Job context stored")

        # Scrape web for real interview data
        research_summary = await run_research(
            session_id,
            request.company_name,
            request.role
        )
        print(f"Research done: {research_summary}")

        # Generate targeted questions
        questions_text = generate_questions(
            session_id,
            request.company_name,
            request.role,
            request.job_description,
            request.num_questions
        )
        print(f"Questions generated")

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


whisper_model = whisper.load_model("base")
@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe audio file using Whisper"""
    try:
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            content = await audio.read()
            tmp.write(content)
            tmp_path = tmp.name
            
        result = whisper_model.transcribe(tmp_path, language="en")
        os.unlink(tmp_path)
        
        return {"text": result["text"].strip()}
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
    
    
@router.post("/speak")
async def speak_text(data: dict):
    """Convert text to speech using edge-tts"""
    try:
        text = data.get("text", "")
        communicate = edge_tts.Communicate(text, voice="en-US-GuyNeural")
        
        audio_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])
        
        audio_buffer.seek(0)
        return StreamingResponse(
            audio_buffer,
            media_type="audio/mpeg"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))