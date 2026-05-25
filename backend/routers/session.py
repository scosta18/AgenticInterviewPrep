from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from core.database import get_all_sessions, get_session_results
from core.report import generate_report
import os

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.get("")
async def list_sessions():
    """Get all interview sessions"""
    return get_all_sessions()

@router.get("/{session_id}")
async def get_session_detail(session_id: int):
    """Get detailed results for a specific session"""
    return get_session_results(session_id)

@router.get("/{session_id}/report")
async def download_report(session_id: int):
    """Generate and download PDF report for a session"""
    try:
        session_data = get_session_results(session_id)
        print(f"✅ Session data fetched: {session_data['session']}")
        filepath = generate_report(session_data)
        print(f"✅ Report filepath: {filepath}")

        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Report generation failed")

        return FileResponse(
            path=filepath,
            media_type="application/pdf",
            filename=os.path.basename(filepath)
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
        