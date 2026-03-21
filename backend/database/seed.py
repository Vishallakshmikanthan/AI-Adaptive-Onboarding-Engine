import json
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sentence_transformers import SentenceTransformer
from database.supabase_client import get_supabase
from dotenv import load_dotenv
load_dotenv()

model = SentenceTransformer("all-MiniLM-L6-v2")
supabase = get_supabase()

def seed_catalog():
    catalog_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "data",
        "course_catalog.json"
    )
    with open(catalog_path, "r") as f:
        catalog = json.load(f)

    print(f"Seeding {len(catalog)} courses into Supabase...")

    success = 0
    failed = 0

    for course in catalog:
        try:
            embedding = model.encode(course["skill"]).tolist()
            data = {
                "id": course["id"],
                "skill_name": course["skill"],
                "display_name": course.get("display_name", course["skill"]),
                "category": course.get("category", "general"),
                "level": course.get("level", "beginner"),
                "prerequisites": course.get("prerequisites", []),
                "estimated_hours": course.get("estimated_hours", 10),
                "description": course.get("description", ""),
                "embedding": embedding
            }
            supabase.table("skills_catalog").upsert(data).execute()
            print(f"  ✓ Seeded: {course['skill']}")
            success += 1
        except Exception as e:
            print(f"  ✗ Failed: {course['skill']} — {e}")
            failed += 1

    print(f"\nDone! {success} succeeded, {failed} failed.")

if __name__ == "__main__":
    seed_catalog()
