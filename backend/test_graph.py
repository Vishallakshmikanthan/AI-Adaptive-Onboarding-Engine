from services.graph_service import generate_adaptive_pathway

catalog = [
    {
        "id": "python-basics",
        "skill": "Python",
        "prerequisites": [],
        "estimated_hours": 10
    },
    {
        "id": "ml-basics",
        "skill": "Machine Learning",
        "prerequisites": ["python-basics"],
        "estimated_hours": 20
    }
]

gaps = [{"skill": "Machine Learning", "gap_score": 0.8}]
known = ["Python"]

result = generate_adaptive_pathway(gaps, known, catalog)

print(result)