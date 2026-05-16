# 🎤 MockMaster AI — AI Mock Interviewer

An AI-powered interview practice tool that evaluates your spoken answers,
detects voice stress, and gives real-time feedback with adaptive difficulty.

## Features

- 🗣️ **Real-time Speech Recognition** — Browser-native Web Speech API (free, no API key needed)
- 🤖 **AI Answer Evaluation** — Gemini 1.5 Flash scores clarity, relevance, depth + gives improvement tips
- 📊 **Voice Stress Analysis** — Web Audio API analyzes pitch, pace, pauses for confidence scoring
- 🚫 **Filler Word Detection** — Detects "um", "uh", "like", "basically" etc. in real-time
- 🎯 **Adaptive Difficulty** — Automatically scales Fresher → Mid → Senior → Staff based on scores
- 📈 **Progress Dashboard** — Track scores, view trends, compare topics with interactive charts
- 🌊 **Live Waveform Visualizer** — Real-time audio visualization during recording
- ⏱️ **Answer Timer** — Visual timer with recommended duration and color-coded progress

## Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | React + Vite | Free |
| Backend | Python FastAPI | Free |
| Speech-to-Text | Web Speech API | Free |
| AI Evaluation | Gemini API (free tier) | Free |
| Voice Analysis | Web Audio API | Free |
| Database | SQLite | Free |
| Charts | Recharts | Free |
| Deployment | Render + Vercel | Free |

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

# Add your Gemini API key
echo GEMINI_API_KEY=your_key_here > .env

# Run server
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in **Chrome or Edge** (required for Speech Recognition).

## How It Works

1. **Choose Topic & Difficulty** — Pick from HR, DSA, System Design, Behavioral, Frontend, Backend
2. **Answer the Question** — Click record, speak your answer naturally
3. **Real-time Feedback** — See live waveform, filler count, and transcript as you speak
4. **AI Evaluation** — Get instant scores, missing points, strengths, and improvement tips
5. **Adaptive Progression** — Score 80+? Questions get harder. Below 40? They get easier.
6. **Track Progress** — View trends, topic performance, and session history on the dashboard

## Deployment (Free)

### Backend → Render.app

```bash
cd backend
echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile
# Push to GitHub → Connect Render → Add GEMINI_API_KEY env var
```

### Frontend → Vercel

```bash
cd frontend
# Add VITE_API_URL=https://your-render-url.onrender.com to Vercel env vars
# Push to GitHub → Connect Vercel → Done
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Create interview session |
| GET | `/api/sessions` | List all sessions |
| GET | `/api/sessions/:id` | Get session detail |
| DELETE | `/api/sessions/:id` | Delete session |
| POST | `/api/evaluate` | Evaluate an answer |
| POST | `/api/question` | Get a question |
| GET | `/api/dashboard` | Get dashboard stats |
| GET | `/api/topics` | List available topics |
| GET | `/api/difficulties` | List difficulty levels |

## License

MIT
