---
title: Agentic Interview Prep Backend
emoji: 🎤
colorFrom: purple
colorTo: blue
sdk: docker
pinned: false
---

# Agentic Interview Prep — Backend

FastAPI backend for the Agentic Interview Prep AI.

# Agentic Interview Prep AI

A full-stack voice-powered interview preparation platform built with agentic AI.
Paste a job description, and the system researches the company, generates targeted
interview questions, conducts a live voice interview, and scores your answers in real time.

**Live demo**
- Frontend (Vercel): https://agentic-interview-prep-ssz9.vercel.app/
- Backend (Hugging Face Spaces): https://scosta18-agentic-interview-prep-backend.hf.space
- API docs: https://scosta18-agentic-interview-prep-backend.hf.space/docs

## Demo Flow
> Start a session → AI researches the company → AI speaks questions → Answer by voice → Get scored feedback → Download PDF report

## Features
- 🎤 **Real-time voice transcription** via Deepgram Nova-2 WebSocket streaming (browser connects directly)
- 🔊 **Neural text-to-speech** via Deepgram Aura-2 (AI speaks questions out loud)
- 🧠 **RAG pipeline** — ChromaDB vector database stores job context and scraped research
- 🔍 **Web research agents** — scrape HackerNews (Algolia API) and Remotive for real role/market context
- 📊 **Answer scoring** — Groq LLM evaluates answers and gives structured, honest feedback
- ⏱️ **Question timer** — countdown with color states (green → yellow → red), auto-submits on timeout
- 📈 **Progress dashboard** — track improvement across sessions
- 📄 **PDF report** — download full session with scores and feedback
- 🎯 **Dynamic question count** — Quick (3), Standard (5), Full (10), Intensive (15)
- 💾 **Session history** — all sessions saved to SQLite

## Tech Stack

**Backend**
- Python + FastAPI
- **Groq API** (`llama-3.3-70b-versatile`) — fast cloud inference for question generation + feedback scoring (~2–3s responses)
- ChromaDB (vector database for RAG) + sentence-transformers (`all-MiniLM-L6-v2`, CPU-only torch)
- Deepgram Nova-2 (speech-to-text, WebSocket streaming)
- Deepgram Aura-2 (text-to-speech)
- SQLite (session storage)
- httpx (async web scraping)
- fpdf2 (PDF report generation)
- Dockerized, deployed on Hugging Face Spaces (CPU basic)

**Frontend**
- React + Vite
- Tailwind CSS
- Deepgram WebSocket (real-time streaming STT, browser → Deepgram directly)
- CSS-based charts for the progress dashboard
- Deployed on Vercel

## Architecture

```
User Voice Input
      ↓
Deepgram WebSocket (real-time STT)
      ↓
FastAPI Backend ──────────────┬──────────────┐
      ↓                       ↓              ↓
Web Scrapers            Groq API        ChromaDB
(HN + Remotive)    (llama-3.3-70b)        (RAG)
      ↓
SQLite + PDF Report
```

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Groq API key](https://console.groq.com) (free tier available)
- [Deepgram API key](https://console.deepgram.com) (free tier — STT + TTS)

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

```
GROQ_API_KEY=your_groq_key_here
DEEPGRAM_API_KEY=your_deepgram_key_here
APP_ENV=development
APP_PORT=8000
DB_PATH=data/sessions.db
CHROMA_PATH=data/chroma
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
- [ ] **Voice-driven coding interview mode** — LeetCode-style problems (Groq-generated), Monaco editor, Piston sandboxed execution, think-aloud transcription, and adaptive difficulty for a full real-interview simulation
- [ ] AWS deployment (Bedrock + EC2 + S3)
- [ ] Stripe integration
- [ ] Reddit API integration for deeper research
- [ ] User authentication (Supabase + Google OAuth)
- [ ] Mobile responsive UI

## Why I Built This
Built after advice from industry leaders to learn AWS and agentic AI.
This project applies those concepts hands-on — RAG pipelines, web research agents,
real-time audio streaming, and production API design — using the same architectural
patterns as enterprise AI systems.

## Author
**Sandro Costa** — [GitHub](https://github.com/scosta18) · [LinkedIn](https://linkedin.com/in/sandro-costa-000b301a2/)