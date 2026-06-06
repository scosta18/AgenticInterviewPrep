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