import requests
import json

try:
    r = requests.post("http://127.0.0.1:8000/api/pathway/analyze", json={
        "resume_text": "John Smith - Python, SQL, Git, React developer with 2 years experience",
        "jd_text": "Senior SWE requiring Java, ML, Docker, Kubernetes, AWS",
        "max_hours": 120
    }, timeout=120)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"Keys: {list(data.keys())}")
        print(f"session_id: {data.get('session_id')}")
        print(f"pathway courses: {len(data.get('pathway', {}).get('pathway', []))}")
    else:
        print(f"Error: {r.text}")
except Exception as e:
    print(f"Request failed: {e}")
