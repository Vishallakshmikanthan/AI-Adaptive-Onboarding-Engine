from services.embed_service import compute_gap_scores

resume_skills = [
    {"skill": "Python"},
    {"skill": "React"}
]

jd_skills = [
    {"skill": "Machine Learning"},
    {"skill": "Python"}
]

result = compute_gap_scores(resume_skills, jd_skills)
print(result)