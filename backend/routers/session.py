from fastapi import APIRouter
from core.database import get_all_sessions, get_session_results

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.get("")
async def list_sessions():
    """Get all interview sessions"""
    return get_all_sessions()

@router.get("/{session_id}")
async def get_session_detail(session_id: int):
    """Get detailed results for a specific session"""
    return get_session_results(session_id)