import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Enforce strict JSON output from Gemini
model = genai.GenerativeModel(
    "gemini-2.5-flash",
    generation_config={"response_mime_type": "application/json"}
)


def evaluate_answer(question: str, answer: str, topic: str, difficulty: str = "Fresher") -> dict:
    """
    Send the candidate's transcript to Gemini for structured evaluation.
    Returns a dict with score, clarity, relevance, feedback, etc.
    """
    prompt = f"""You are an expert technical interviewer conducting a {difficulty}-level interview.

Topic: {topic}
Difficulty Level: {difficulty}
Question: {question}
Candidate's Answer: {answer}

Evaluate the answer based on the difficulty level. For "{difficulty}" level, adjust your expectations accordingly.

Return ONLY a valid JSON object with exactly these keys:
{{
  "score": <integer 0-100>,
  "clarity": "<Good|Average|Poor>",
  "relevance": "<Good|Average|Poor>",
  "depth": "<Excellent|Good|Average|Shallow>",
  "missing_points": ["point1", "point2"],
  "strengths": ["strength1", "strength2"],
  "improvement_tip": "<one specific, actionable tip>",
  "follow_up_question": "<a harder follow-up question based on their answer>",
  "ideal_answer_summary": "<2-3 sentence summary of an ideal answer>"
}}

Be constructive but honest. If the answer is empty or gibberish, give a score of 0.
"""
    try:
        response = None
        errors = []
        for model_name in ["gemini-2.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"]:
            try:
                temp_model = genai.GenerativeModel(
                    model_name,
                    generation_config={"response_mime_type": "application/json"}
                )
                response = temp_model.generate_content(prompt)
                break
            except Exception as e:
                errors.append(f"{model_name}: {e}")
                
        if not response:
            raise Exception(f"All models failed for evaluation. Errors: {errors}")
            
        text = response.text.strip()
        result = json.loads(text)

        # Ensure all required keys exist with defaults
        defaults = {
            "score": 0,
            "clarity": "Poor",
            "relevance": "Poor",
            "depth": "Shallow",
            "missing_points": [],
            "strengths": [],
            "improvement_tip": "Try to provide more detailed answers.",
            "follow_up_question": "Can you elaborate on your answer?",
            "ideal_answer_summary": "",
        }
        for key, default in defaults.items():
            if key not in result:
                result[key] = default

        return result

    except json.JSONDecodeError:
        return {
            "score": 0,
            "clarity": "Poor",
            "relevance": "Poor",
            "depth": "Shallow",
            "missing_points": ["Could not parse evaluation"],
            "strengths": [],
            "improvement_tip": "The AI could not evaluate your answer. Please try again with a clearer response.",
            "follow_up_question": question,
            "ideal_answer_summary": "",
        }
    except Exception as e:
        return {
            "score": 0,
            "clarity": "Poor",
            "relevance": "Poor",
            "depth": "Shallow",
            "missing_points": [str(e)],
            "strengths": [],
            "improvement_tip": "An error occurred during evaluation.",
            "follow_up_question": question,
            "ideal_answer_summary": "",
        }
