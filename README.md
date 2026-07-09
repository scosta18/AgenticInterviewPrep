# Agentic Interview Prep AI

A full-stack AI interview preparation platform that researches your target company, conducts live voice interviews, and scores your performance — for every major, every role.

---

## What it does

Paste a job description, upload your resume, and the platform:

1. Runs an **agentic research pipeline** — an AI agent decides what to search, calls HackerNews and Remotive APIs, evaluates the results, and iterates until it has enough context
2. Generates **targeted interview questions** tailored to the company, role, and your resume
3. Conducts a **live voice interview** — AI speaks questions aloud, you answer by voice, real-time transcription appears as you speak
4. Scores every answer with **brutally honest feedback** and a numeric score
5. Produces a **PDF report** with your full session results

For technical roles, there's also a **coding interview mode** with a Monaco editor, AI-generated LeetCode-style problems, adaptive difficulty, and voice commands.

---

## Features

### Interview Modes
- 🎤 **Behavioral voice interview** — real-time STT via Deepgram Nova-2, TTS via Deepgram Aura-2
- 💻 **Coding interview** — Monaco editor, role-targeted problems, AI code review
- 🔊 **Voice commands** in coding mode — say "hint", "submit", "repeat", or "new problem"

### AI / Agentic
- 🤖 **Research agent** — Groq function calling; agent decides which tools to call, what to search, and when it has enough context (up to 4 iterations)
- 🧠 **RAG pipeline** — ChromaDB vector store, sentence-transformers embeddings, context retrieved per session
- 📈 **Adaptive difficulty** — after each coding problem, agent picks the next difficulty based on your score
- 💡 **Hint generation** — Groq generates nudge-style hints without giving away the answer
- 📄 **Resume-aware questions** — upload your resume, questions tailored to your actual background

### Progress & Reporting
- 📊 **Progress dashboard** — avg score per session, trend, best session, separate charts for behavioral and coding
- 📋 **Session history** — full Q&A, scores, and feedback for every past session
- 📄 **PDF report** — download after every behavioral session

### UX
- ⏱️ **Question timer** — countdown with color states, auto-submits on timeout
- 🔁 **Repeat question** button + TTS pre-fetch for low latency
- 🎯 **Onboarding flow** — field/major selection, prep type, interview type, resume upload
- 🏠 **Landing page** — explains the platform for all majors

---

## Tech Stack

**Backend**
- Python + FastAPI
- Groq API (`llama-3.3-70b-versatile`) — question generation, feedback scoring, research agent, code review, hint generation, adaptive difficulty
- Deepgram Nova-2 — real-time STT (WebSocket, browser connects directly)
- Deepgram Aura-2 — TTS (AI speaks questions aloud)
- ChromaDB + sentence-transformers (`all-MiniLM-L6-v2`) — vector store for RAG
- SQLite — session storage
- httpx — async web scraping (HackerNews Algolia API + Remotive API)
- fpdf2 — PDF report generation
- pymupdf + python-docx — resume text extraction
- Deployed on Hugging Face Spaces (Docker, CPU basic)

**Frontend**
- React + Vite + Tailwind CSS
- Monaco Editor (`@monaco-editor/react`) — VS Code's editor in the browser
- Deepgram WebSocket — real-time STT direct from browser
- CSS-based charts for dashboard
- Deployed on Vercel

---

## Architecture

```
Browser (React + Vite)
      |
      ├── Deepgram WebSocket (real-time STT, browser → Deepgram directly)
      |
      └── FastAPI Backend (Hugging Face Spaces)
              |
              ├── Research Agent (Groq function calling)
              │       ├── search_hn_comments()
              │       ├── search_hn_stories()
              │       └── search_remotive()
              |
              ├── Groq API (question gen, feedback, review, hints, difficulty)
              |
              ├── ChromaDB (RAG vector store)
              |
              └── SQLite (sessions, questions, coding_questions)
```

---

## Project Structure

```
AgenticInterviewPrep/
├── backend/
│   ├── agents/
│   │   ├── scrapper.py          — agentic research pipeline (Groq function calling)
│   │   ├── question_generator.py — Groq question generation
│   │   ├── feedback_engine.py   — Groq answer scoring
│   │   └── coding_interview.py  — problem gen, code review, hints, adaptive difficulty
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py          — SQLite (sessions, questions, coding_questions)
│   │   ├── vector_store.py      — ChromaDB
│   │   ├── resume.py            — PDF/DOCX text extraction
│   │   └── report.py            — PDF generation
│   ├── routers/
│   │   ├── interview.py         — behavioral interview endpoints
│   │   ├── coding.py            — coding interview endpoints
│   │   └── session.py           — history + PDF download
│   ├── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── LandingPage.jsx
│       │   ├── Onboarding.jsx
│       │   ├── Interview.jsx
│       │   ├── CodingInterview.jsx
│       │   ├── Dashboard.jsx
│       │   └── History.jsx
│       └── api/client.jsx
└── README.md
```

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API key — [console.groq.com](https://console.groq.com)
- Deepgram API key — [console.deepgram.com](https://console.deepgram.com)

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:
```
GROQ_API_KEY=your_groq_key
DEEPGRAM_API_KEY=your_deepgram_key
APP_ENV=development
APP_PORT=8000
DB_PATH=data/sessions.db
CHROMA_PATH=data/chroma
```

```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

---

## Roadmap

- [ ] Auth — candidate and recruiter accounts (Supabase + Google OAuth)
- [ ] Recruiter dashboard — invite candidates, view results
- [ ] More interview types — Case Interview, Product Sense, System Design
- [ ] AI avatar — animated visual interviewer
- [ ] Practice mode vs Mock Interview mode
- [ ] AWS deployment (Bedrock + EC2 + S3)
- [ ] Stripe integration
- [ ] Mobile responsive UI

---

## Why I Built This

Built following advice from industry leaders to learn AWS and agentic AI. This project applies those concepts hands-on — Groq function calling for a real agent loop, RAG pipelines, real-time audio streaming, adaptive systems, and full-stack production API design.

The platform is designed for everyone — not just CS majors. Business, healthcare, marketing, engineering — anyone preparing for a high-stakes interview can use it.

## Author

**Sandro Costa** — [GitHub](https://github.com/scosta18) · [LinkedIn](https://linkedin.com/in/sandro-costa-000b301a2/)
