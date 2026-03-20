from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os
import traceback

from services.llm_service import extract_skills_and_gaps
from services.embed_service import compute_gap_scores
from services.graph_service import generate_adaptive_pathway

router = APIRouter()

CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "course_catalog.json")


def load_catalog() -> list:
    with open(CATALOG_PATH, "r") as f:
        return json.load(f)


class AnalyzeRequest(BaseModel):
    resume_text: str
    jd_text: str
    max_hours: int = 120


def _normalize_gap(gap: dict, source: str) -> dict:
    """Normalize a gap entry to a consistent format."""
    skill = gap.get("skill", "")
    # semantic gaps use 'skill' only; LLM gaps may have 'catalog_skill'
    catalog_skill = gap.get("catalog_skill") or skill
    severity = float(gap.get("gap_severity", gap.get("gap_score", 0.5)))
    severity = max(0.0, min(1.0, severity))
    priority = gap.get("priority", "high" if severity > 0.6 else "medium")
    return {
        "skill": skill,
        "catalog_skill": catalog_skill,
        "gap_severity": severity,
        "priority": priority,
    }


def _merge_gaps(llm_gaps: list, semantic_gaps: list) -> list:
    """Merge LLM and semantic gaps, deduplicating by catalog_skill and keeping higher severity."""
    merged: dict[str, dict] = {}

    for gap in llm_gaps:
        normalized = _normalize_gap(gap, "llm")
        key = normalized["catalog_skill"].lower()
        if key not in merged or normalized["gap_severity"] > merged[key]["gap_severity"]:
            merged[key] = normalized

    for gap in semantic_gaps:
        normalized = _normalize_gap(gap, "semantic")
        key = normalized["catalog_skill"].lower()
        if key not in merged or normalized["gap_severity"] > merged[key]["gap_severity"]:
            merged[key] = normalized

    return list(merged.values())


@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    try:
        # Step 1 — Load catalog
        catalog = load_catalog()

        # Step 2 — LLM extraction
        llm_result = extract_skills_and_gaps(
            request.resume_text,
            request.jd_text,
            catalog,
        )

        resume_skills = llm_result.get("resume_skills") or []
        jd_skills = llm_result.get("jd_required_skills") or []
        skill_gaps_raw = llm_result.get("skill_gaps") or []

        # Step 3 — Semantic gap scoring (only if both lists are non-empty)
        semantic_gaps = []
        if resume_skills and jd_skills:
            semantic_gaps = compute_gap_scores(resume_skills, jd_skills)

        # Step 4 — Merge and deduplicate gaps
        final_gaps = _merge_gaps(skill_gaps_raw, semantic_gaps)

        # Step 5 — Extract known skills
        known_skills = [s.get("skill", "") for s in resume_skills]

        # Step 6 — Generate pathway
        pathway_result = generate_adaptive_pathway(
            final_gaps,
            known_skills,
            catalog,
            request.max_hours,
        )

        # Step 7 — Return response
        return {
            "resume_skills": resume_skills,
            "jd_required_skills": jd_skills,
            "skill_gaps": final_gaps,
            "pathway": pathway_result,
            "reasoning_trace": llm_result.get("reasoning_trace", ""),
            "match_score": llm_result.get("match_score", 0),
        }

    except RuntimeError as e:
        # LLM / Gemini failures
        raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"Catalog not found: {str(e)}")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
