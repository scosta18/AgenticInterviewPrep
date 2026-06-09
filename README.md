# Agentic Interview Prep AI

A full-stack voice-powered interview preparation platform built with agentic AI. 
Paste a job description, and the system researches the company, generates targeted 
interview questions, conducts a live voice interview, and scores your answers in real time.

## Demo
> Start a session → AI speaks questions → Answer by voice → Get scored feedback → Download PDF report

## Features
- 🎤 **Real-time voice transcription** via Deepgram Nova-2 WebSocket streaming
- 🔊 **Neural text-to-speech** via Deepgram Aura-2 (AI speaks questions out loud)
- 🧠 **RAG pipeline** — ChromaDB vector database stores job context and scraped research
- 🔍 **Web research agents** — scrapes HackerNews and Remotive for real interview insights
- 📊 **Answer scoring** — LLM evaluates answers and gives structured feedback
- ⏱️ **Question timer** — countdown with color states (green → yellow → red)
- 📈 **Progress dashboard** — track improvement across sessions
- 📄 **PDF report** — download full session with scores and feedback
- 🎯 **Dynamic question count** — Quick (3), Standard (5), Full (10), Intensive (15)
- 💾 **Session history** — all sessions saved to SQLite

## Tech Stack

**Backend**
- Python + FastAPI
- LangChain + Ollama (Llama 3.2 — runs 100% locally)
- ChromaDB (vector database for RAG)
- Deepgram Nova-2 (speech-to-text)
- Deepgram Aura-2 (text-to-speech)
- SQLite (session storage)
- httpx (async web scraping)

**Frontend**
- React + Vite
- Tailwind CSS
- Deepgram WebSocket (real-time streaming STT)
- Recharts (progress dashboard)

## Architecture

User Voice Input
↓
Deepgram WebSocket (real-time STT)
↓
FastAPI Backend
↓
LangChain Agent Orchestrator
↓              ↓              ↓
Web Scraper      Llama 3.2      ChromaDB
(HN + Remotive)  (Ollama)       (RAG)
↓
SQLite + PDF Report

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com) installed locally
- [Deepgram API key](https://console.deepgram.com) (free tier — 45hrs/month STT + TTS)

### 1. Clone the repo
```bash
git clone https://github.com/scosta18/AgenticInterviewPrep.git
cd AgenticInterviewPrep
```

### 2. Set up the backend
```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the project root:

MODEL_NAME=llama3.2
DEEPGRAM_API_KEY=your_deepgram_key_here
APP_ENV=development
APP_PORT=8000
DB_PATH=data/sessions.db
CHROMA_PATH=data/chroma

Pull the local AI model:
```bash
ollama pull llama3.2
```

Start the backend:
```bash
python -m uvicorn main:app --reload --port 8000
```

### 3. Set up the frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

## Usage
1. Enter company name, role, and paste the job description
2. Choose number of questions (3 / 5 / 10 / 15)
3. Optionally add company context (interviewer info, culture notes)
4. Click **Start Session** — AI researches the company and generates targeted questions
5. AI speaks each question out loud
6. Answer by voice (mic button) or type your answer
7. Submit answer — AI scores it and gives detailed feedback
8. Complete session — download PDF report
9. Track progress in the Dashboard

## Roadmap
- [ ] AWS deployment (Bedrock + EC2 + S3)
- [ ] Stripe integration
- [ ] Latency optimization (streaming responses)
- [ ] Reddit API integration for deeper research
- [ ] Auto-submit when timer hits zero
- [ ] Mobile responsive UI

## Why I Built This
Built after advice from industry leaders to learn AWS and agentic AI. 
This project applies those concepts hands-on — RAG pipelines, agent orchestration, 
real-time audio streaming, and production API design — using the same architectural 
patterns as enterprise AI systems.

## Author
**Sandro Costa** — [GitHub](https://github.com/scosta18) · [LinkedIn](https://linkedin.com/in/sandro-costa-000b301a2/)