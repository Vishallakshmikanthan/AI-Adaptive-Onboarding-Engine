import urllib.request

url = "http://localhost:8000/api/pathway/analyze"
data = b'{"resume_text":"Python developer with 3 years experience in Django and REST APIs","jd_text":"Looking for a Python backend developer with ML and FastAPI experience","max_hours":120}'
headers = {"Content-Type": "application/json"}

req = urllib.request.Request(url, data=data, headers=headers)
try:
    r = urllib.request.urlopen(req)
    import json
    result = json.loads(r.read().decode())
    print("SUCCESS!")
    print(f"  Match score: {result.get('match_score')}")
    print(f"  Skill gaps:  {len(result.get('skill_gaps', []))}")
    pw = result.get('pathway', {})
    print(f"  Courses:     {pw.get('total_courses')}")
    print(f"  Hours:       {pw.get('total_estimated_hours')}")
except urllib.error.HTTPError as e:
    body = e.read().decode()[:500]
    print(f"HTTP {e.code}: {body}")
