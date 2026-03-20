from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from services.embed_service import compute_gap_scores

router = APIRouter()

class GapRequest(BaseModel):
    resume_skills: List[dict]
    jd_skills: List[dict]

@router.post("/analyze")
async def analyze_gap(request: GapRequest):
    try:
        gaps = compute_gap_scores(request.resume_skills, request.jd_skills)
        return {"status": "success", "gaps": gaps}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
