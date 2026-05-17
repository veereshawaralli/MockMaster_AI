# 🎤 MockMaster AI — AI Mock Interviewer

MockMaster AI is a premium, high-end AI-powered interview practice platform with a **2050 Cyber-Aesthetic**. It records your spoken answers, uses advanced Web Audio API analysis to determine real-time stress levels, detects filler words, and leverages Gemini API models to provide multi-dimensional scoring and constructive feedback with adaptive difficulty scaling.

---

## 🚀 Key Premium Features

*   🤖 **AI Question Generation & Evaluation** — Uses a custom fallback chain (`gemini-2.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-2.5-flash`) to generate contextual technical questions and score answers on Clarity, Relevance, Depth, and Strengths.
*   🔄 **Gemini Rate-Limit Resilience** — Automatically switches between multiple high-performance Gemini models to prevent `429 Quota Exceeded` errors.
*   🗣️ **Real-time Speech Recognition** — Free, browser-native Web Speech API.
*   📊 **Voice Stress & Speech Analysis** — Real-time Web Audio API pitch, speaking pace, and pause tracking to calculate candidate confidence scores.
*   ⚡ **CORS-Protected Cloud Ready** — Dynamic CORS origin matching with trailing-slash auto-stripping for secure, production-grade API hosting.
*   🗄️ **Dual-Database Engine** — Runs zero-setup local **SQLite** for development and dynamically swaps to **PostgreSQL** in production (like Supabase, Neon, or Render Postgres) when a `DATABASE_URL` is detected.
*   🎯 **Adaptive Difficulty** — Dynamically adjusts question tiers (**Fresher ➔ Mid ➔ Senior ➔ Staff**) based on your performance.
*   📈 **3D Hologram Dashboard** — Stupendous cyber-dashboard tracking session history, confidence trends, per-topic averages, and most improved categories with interactive responsive charts.
*   🌊 **Dynamic Waveform Visualizer** — Optimally-engineered GPU-stable canvas visualizer displaying active audio waves.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) + Recharts | Sleek interactive user interface |
| **Backend** | Python FastAPI | High-performance async/sync endpoints |
| **Database** | SQLite + PostgreSQL (psycopg2) | Dynamic dev/prod data store |
| **AI Layer** | Gemini API | Real-time evaluations & question generation |
| **Speech-to-Text** | Web Speech API | Browser-native audio transcription |
| **Audio Analysis** | Web Audio API | Stress, pitch, pace, and pause metrics |
| **Hosting** | Render + Vercel | Seamless cloud deployments |

---

## 🏃‍♂️ Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

# Add your Gemini API key to .env
echo GEMINI_API_KEY=your_key_here > .env

# Run FastAPI Server
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in **Chrome or Edge** (required for browser-native speech recognition) and begin practicing!

---

## ☁️ Production Deployment

### 1. Backend (FastAPI) on Render
1. Create a **Web Service** on Render and link your repo.
2. Set the **Root Directory** to `backend`.
3. Set the build and start commands:
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. In the **Environment** tab, add your variables:
   * `GEMINI_API_KEY` = `[Your Gemini Key]`
   * `DATABASE_URL` = `[Your Neon or Render PostgreSQL Connection URL]`
   * `ALLOWED_ORIGINS` = `[Your Deployed Vercel Frontend URL]`

### 2. Frontend (React) on Vercel
1. Create a **Project** on Vercel and link your repo.
2. Set the **Root Directory** to `frontend`.
3. Vercel will automatically detect `Vite` preset.
4. Add the following **Environment Variable**:
   * `VITE_API_URL` = `[Your Deployed Render Backend URL]`

---

## 📡 Core API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/sessions` | Create a new mock interview session |
| **GET** | `/api/sessions` | List all previous interview sessions |
| **GET** | `/api/sessions/{id}` | Get detailed question-by-question session breakdown |
| **DELETE** | `/api/sessions/{id}` | Delete a session and its answer records |
| **POST** | `/api/evaluate` | Run AI evaluation on spoken candidate answers |
| **POST** | `/api/question` | Request a calibrated AI question (excludes previous questions) |
| **GET** | `/api/dashboard` | Get dashboard statistics & aggregated progress charts |

---

## 📜 License
MIT
