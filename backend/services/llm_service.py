import os
import json
import time
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

primary_model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config=genai.GenerationConfig(
        temperature=0.1,
        max_output_tokens=2000,
        response_mime_type="application/json",
    ),
)

fallback_model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=genai.GenerationConfig(
        temperature=0.1,
        max_output_tokens=2000,
        response_mime_type="application/json",
    ),
)


def _parse_json_response(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        return json.loads(cleaned.strip())


def call_gemini(prompt: str, max_retries: int = 3) -> dict:
    last_error = None
    for model in [primary_model, fallback_model]:
        for attempt in range(max_retries):
            try:
                response = model.generate_content(prompt)
                return _parse_json_response(response.text)
            except Exception as e:
                last_error = e
                if "429" in str(e) or "resource_exhausted" in str(e).lower():
                    time.sleep(60)
                elif attempt < max_retries - 1:
                    time.sleep(2)
                else:
                    break
    raise RuntimeError(f"Gemini API call failed after all retries: {last_error}")


def extract_skills_and_gaps(resume_text: str, jd_text: str, catalog: list) -> dict:
    catalog_names = [c["skill"] for c in catalog[:40]]
    catalog_str = ", ".join(catalog_names)

    prompt = f"""You are a precise skill extraction engine. Analyze the resume and job description below.
You MUST only reference skills that exist in the provided skill catalog. Do NOT invent or hallucinate skills outside the catalog.

SKILL CATALOG:
{catalog_str}

RESUME TEXT:
{resume_text[:3000]}

JOB DESCRIPTION:
{jd_text[:2000]}

INSTRUCTIONS:
1. Extract skills found in the resume that match the catalog. For each, estimate proficiency level (beginner/intermediate/advanced) and approximate years of experience.
2. Extract skills required by the job description that match the catalog. For each, assign a priority (high/medium/low) and a required_level (beginner/intermediate/advanced).
3. Identify skill gaps: skills required by the JD but missing or insufficient in the resume. For each gap, provide the catalog_skill it maps to, a gap_severity score from 0.0 to 1.0 (1.0 = completely missing), and a brief reason.
4. Write a reasoning_trace: a step-by-step explanation of how you arrived at the skill gaps.
5. Compute a match_score from 0.0 to 1.0 indicating overall resume-to-JD fit.

Return ONLY a valid JSON object with this exact structure. No explanation, no markdown, no code fences, no preamble. Start your response directly with {{

{{
  "resume_skills": [
    {{"skill": "string", "level": "string", "years": 0}}
  ],
  "jd_required_skills": [
    {{"skill": "string", "priority": "string", "required_level": "string"}}
  ],
  "skill_gaps": [
    {{
      "skill": "string",
      "catalog_skill": "string",
      "gap_severity": 0.0,
      "reason": "string"
    }}
  ],
  "reasoning_trace": "string",
  "match_score": 0.0
}}"""

    return call_gemini(prompt)
