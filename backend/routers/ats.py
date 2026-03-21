from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.llm_service import call_llm

router = APIRouter()

class ATSRequest(BaseModel):
    resume_text: str
    jd_text: str

@router.post("/check")
async def check_ats(request: ATSRequest):
    try:
        prompt = f"""You are an expert ATS (Applicant Tracking System) analyzer with 10 years of experience helping candidates pass automated resume screening.

Analyze this resume against the job description and provide a detailed ATS compatibility report.

RESUME TEXT:
{request.resume_text[:3000]}

JOB DESCRIPTION:
{request.jd_text[:2000]}

Return ONLY a valid JSON object. No markdown. No explanation. No code fences. Start your response directly with the opening curly brace.

{{
  "overall_score": <integer between 0 and 100>,
  "grade": "<exactly one of: A, B, C, D, F>",
  "summary": "<2 sentences describing overall ATS compatibility>",
  "keyword_analysis": {{
    "score": <integer 0-100>,
    "matched_keywords": ["<keyword>"],
    "missing_keywords": ["<keyword>"],
    "keyword_density": "<brief assessment of keyword usage>"
  }},
  "format_analysis": {{
    "score": <integer 0-100>,
    "issues": ["<specific formatting issue>"],
    "strengths": ["<specific formatting strength>"]
  }},
  "section_analysis": {{
    "has_contact_info": <true or false>,
    "has_summary": <true or false>,
    "has_experience": <true or false>,
    "has_education": <true or false>,
    "has_skills": <true or false>,
    "missing_sections": ["<section name if missing>"]
  }},
  "experience_match": {{
    "score": <integer 0-100>,
    "years_found": <integer>,
    "years_required": <integer>,
    "assessment": "<one sentence assessment>"
  }},
  "improvements": [
    {{
      "priority": "<exactly one of: high, medium, low>",
      "category": "<exactly one of: keywords, format, content, sections>",
      "issue": "<what is wrong, one sentence>",
      "fix": "<exactly how to fix it, one sentence>"
    }}
  ],
  "quick_wins": [
    "<specific actionable change that takes under 5 minutes>",
    "<specific actionable change that takes under 5 minutes>",
    "<specific actionable change that takes under 5 minutes>"
  ]
}}"""

        result = call_llm(prompt)
        return {"status": "success", "data": result}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ATS analysis failed: {str(e)}"
        )
