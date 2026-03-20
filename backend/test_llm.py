import os

from services.llm_service import extract_skills_and_gaps
print("GEMINI KEY:", (os.getenv("GEMINI_API_KEY") or "NOT SET")[:10] + "...")
resume = "Python, React, REST APIs"
jd = "Machine Learning, Python, Docker"

catalog = [
    {"skill": "Python"},
    {"skill": "Machine Learning"},
    {"skill": "Docker"}
]

result = extract_skills_and_gaps(resume, jd, catalog)
print(result)