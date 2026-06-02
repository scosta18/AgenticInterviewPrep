from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import init_db
from routers.interview import router as interview_router
from routers.session import router as session_router
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(
    title = "Agentic Interview Prep",
    description = "Voice-powered interview preparation with real-time AI coaching",
    version="1.0.0"
)

#CORS - allows React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


#Initialize databse on startup
@app.on_event("startup")
async def startup():
    init_db()
    print("Interview Prep AI Backend running")
    
#Register routers
app.include_router(interview_router)
app.include_router(session_router)

@app.get("/")
async def root():
    return{
        "message": "Interview Prep AI API",
        "version": "1.0.0",
        "status": "running"
    }
    
@app.get("/health")
async def health():
    return{"status": "healthy"}