from database.supabase_client import get_supabase
from datetime import datetime


def _get_client():
    """Lazy Supabase client accessor."""
    try:
        return get_supabase()
    except Exception as e:
        print(f"Supabase client unavailable: {e}")
        return None


def save_session(
    resume_filename: str,
    jd_filename: str,
    resume_skills: list,
    jd_required_skills: list,
    skill_gaps: list,
    pathway: dict,
    reasoning_trace: str,
    match_score: float
) -> str:
    client = _get_client()
    if client is None:
        return None
    try:
        data = {
            "resume_filename": resume_filename,
            "jd_filename": jd_filename,
            "resume_skills": resume_skills,
            "jd_required_skills": jd_required_skills,
            "skill_gaps": skill_gaps,
            "pathway": pathway,
            "reasoning_trace": reasoning_trace,
            "match_score": match_score,
            "total_courses": pathway.get("total_courses", 0),
            "total_hours": pathway.get("total_estimated_hours", 0),
            "courses_skipped": pathway.get("courses_skipped", 0)
        }
        result = client.table("analysis_sessions").insert(data).execute()
        session_id = result.data[0]["id"]
        print(f"Session saved: {session_id}")
        return session_id
    except Exception as e:
        print(f"Failed to save session: {e}")
        return None

def get_recent_sessions(limit: int = 5) -> list:
    client = _get_client()
    if client is None:
        return []
    try:
        result = client.table("analysis_sessions") \
            .select("id, resume_filename, jd_filename, match_score, total_courses, total_hours, created_at") \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        return result.data
    except Exception as e:
        print(f"Failed to fetch sessions: {e}")
        return []

def get_session_by_id(session_id: str) -> dict:
    client = _get_client()
    if client is None:
        return None
    try:
        result = client.table("analysis_sessions") \
            .select("*") \
            .eq("id", session_id) \
            .single() \
            .execute()
        return result.data
    except Exception as e:
        print(f"Failed to fetch session {session_id}: {e}")
        return None
