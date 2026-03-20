from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")


def get_embedding(text: str) -> list:
    return model.encode(text).tolist()


def cosine_similarity(a: list, b: list) -> float:
    a = np.array(a)
    b = np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def find_best_catalog_match(skill_name: str, catalog: list) -> dict:
    skill_emb = get_embedding(skill_name)
    best_course = None
    best_score = -1.0

    for entry in catalog:
        entry_emb = get_embedding(entry["skill"])
        score = cosine_similarity(skill_emb, entry_emb)
        if score > best_score:
            best_score = score
            best_course = entry

    return {
        "match": best_course,
        "similarity": best_score,
        "is_strong_match": best_score > 0.7,
    }


def compute_gap_scores(resume_skills: list, jd_skills: list) -> list:
    resume_embeddings = [get_embedding(s["skill"]) for s in resume_skills]

    gaps = []
    for jd in jd_skills:
        jd_emb = get_embedding(jd["skill"])
        max_sim = max(
            (cosine_similarity(jd_emb, r_emb) for r_emb in resume_embeddings),
            default=0.0,
        )
        gap_score = round(1 - max_sim, 4)
        if gap_score > 0.3:
            priority = "high" if gap_score > 0.6 else "medium"
            gaps.append({
                "skill": jd["skill"],
                "gap_score": gap_score,
                "priority": priority,
            })

    gaps.sort(key=lambda g: g["gap_score"], reverse=True)
    return gaps
