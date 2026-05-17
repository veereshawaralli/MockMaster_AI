from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.evaluator import evaluate_answer
from services.question_bank import get_question, get_next_difficulty, get_all_topics, get_all_difficulties
from database import save_answer

router = APIRouter(prefix="/api", tags=["evaluate"])


class EvaluateRequest(BaseModel):
    session_id: int
    question: str
    transcript: str
    topic: str
    difficulty: str = "Fresher"
    confidence_score: int = 50
    avg_pitch: float = 0.0
    pause_count: int = 0
    speaking_pace: str = "Normal"
    filler_count: int = 0
    fillers: dict = {}


class QuestionRequest(BaseModel):
    topic: str
    difficulty: str = "Fresher"
    exclude: list = []


@router.post("/evaluate")
def evaluate(req: EvaluateRequest):
    if not req.transcript or len(req.transcript.strip()) < 3:
        return {"evaluation": {"score": 0, "clarity": "Poor", "relevance": "Poor", "depth": "Shallow", "missing_points": ["No answer provided"], "strengths": [], "improvement_tip": "Provide a clear answer.", "follow_up_question": req.question, "ideal_answer_summary": ""}, "saved": False}

    evaluation = evaluate_answer(req.question, req.transcript, req.topic, req.difficulty)
    answer_data = {
        "question": req.question, "transcript": req.transcript,
        "score": evaluation.get("score", 0), "clarity": evaluation.get("clarity", ""),
        "relevance": evaluation.get("relevance", ""), "confidence_score": req.confidence_score,
        "filler_count": req.filler_count, "speaking_pace": req.speaking_pace,
        "avg_pitch": req.avg_pitch, "pause_count": req.pause_count,
        "improvement_tip": evaluation.get("improvement_tip", ""),
        "follow_up_question": evaluation.get("follow_up_question", ""),
        "missing_points": evaluation.get("missing_points", []),
        "strengths": evaluation.get("strengths", []),
        "fillers": req.fillers, "difficulty": req.difficulty,
    }
    answer_id = save_answer(req.session_id, answer_data)
    return {"evaluation": evaluation, "answer_id": answer_id, "saved": True}


@router.post("/question")
def next_question(req: QuestionRequest):
    return get_question(req.topic, req.difficulty, req.exclude)


@router.post("/adapt-difficulty")
async def adapt_difficulty(current: str = "Fresher", scores: list = []):
    return {"recommended_difficulty": get_next_difficulty(current, scores), "current_difficulty": current}


@router.get("/topics")
async def topics():
    return {"topics": get_all_topics()}


@router.get("/difficulties")
async def difficulties():
    return {"difficulties": get_all_difficulties()}
