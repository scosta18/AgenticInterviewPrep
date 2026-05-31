# Agentic Interview Prep

A locally-hosted, AI-powered interview preparation tool. Given a company name, role, and job description, it scrapes real interview experiences from the web, generates targeted questions using a local LLM via Ollama, lets you answer by voice or text, scores your responses with structured feedback, and exports a full PDF session report.

## How it works

1. **Research** — scrapes Google and Reddit for real interview experiences related to the company and role
2. **RAG pipeline** — stores scraped content and the job description in a ChromaDB vector store per session
3. **Question generation** — a local LLM (Llama 3.1 via Ollama) generates targeted behavioral and technical questions grounded in the retrieved context
4. **Answer & feedback** — you answer each question (text or voice), and the LLM scores it 1–10 with structured strengths, improvements, and a model answer
5. **PDF report** — a downloadable session report with all questions, your answers, scores, and feedback

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router |
| Backend | FastAPI, Python |
| LLM | Ollama (llama3.1) via LangChain |
| Vector DB | ChromaDB + sentence-transformers (`all-MiniLM-L6-v2`) |
| Voice input | OpenAI Whisper (`base` model) |
| Voice output | edge-tts (Microsoft Neural voices) |
| Database | SQLite |
| PDF export | fpdf2 |
| Web scraping | httpx (Google + Reddit JSON API) |

## Prerequisites

- [Ollama](https://ollama.ai) installed and running locally
- Llama 3.1 pulled: `ollama pull llama3.1`
- Python 3.10+
- Node.js 18+

## Setup

### Backend

```bash
# From the project root
pip install -r requirement.txt

# Run the FastAPI server
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`. The backend API runs at `http://localhost:8000`.

## Configuration

Settings are controlled via environment variables or a `.env` file in the project root:

| Variable | Default | Description |
|---|---|---|
| `MODEL_NAME` | `llama3.1` | Ollama model to use |
| `WHISPER_MODE` | `base` | Whisper model size (`tiny`, `base`, `small`, etc.) |
| `APP_PORT` | `8000` | Backend port |
| `DB_PATH` | `data/sessions.db` | SQLite database path |
| `CHROMA_PATH` | `data/chroma` | ChromaDB persistence path |

## Project structure

```
.
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── agents/
│   │   ├── question_generator.py  # LLM-powered question generation
│   │   ├── feedback_engine.py     # LLM-powered answer scoring
│   │   ├── voice.py               # Voice utilities
│   │   └── scrapper.py            # HackerNews + Remotive scraping
│   ├── core/
│   │   ├── config.py              # Settings (pydantic-settings)
│   │   ├── database.py            # SQLite session management
│   │   ├── vector_store.py        # ChromaDB RAG pipeline
│   │   └── report.py              # PDF report generation
│   ├── routers/
│   │   ├── interview.py           # /interview endpoints
│   │   └── session.py             # /session endpoints
│   └── data/
│       ├── sessions.db
│       ├── chroma/
│       └── reports/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Setup.jsx          # Session setup form
│       │   ├── Interview.jsx      # Q&A interface with voice support
│       │   ├── Feedback.jsx       # Per-answer feedback display
│       │   └── History.jsx        # Past session history
│       └── api/                   # Axios API client
├── data/
│   └── job_description.txt
└── requirement.txt
```

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/interview/start` | Start a session: scrape, embed, generate questions |
| `POST` | `/interview/answer` | Submit an answer and get AI feedback |
| `GET` | `/interview/session/{id}` | Retrieve session results |
| `POST` | `/interview/session/{id}/complete` | Mark session complete |
| `POST` | `/interview/transcribe` | Transcribe audio (Whisper) |
| `POST` | `/interview/speak` | Text-to-speech (edge-tts) |
| `GET` | `/health` | Health check |
