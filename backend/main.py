from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routes.evaluate import router as evaluate_router
from routes.sessions import router as sessions_router

app = FastAPI(title="AI Mock Interviewer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(evaluate_router)
app.include_router(sessions_router)


@app.on_event("startup")
async def startup():
    init_db()


@app.get("/")
async def root():
    return {"message": "AI Mock Interviewer API is running", "version": "1.0.0"}


# Run: uvicorn main:app --reload
