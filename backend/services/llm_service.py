import os
import json
import time
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

_client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

# Models to try in order — most capable/free first
MODEL_NAMES = [
    "google/gemini-2.0-flash-001",
    "google/gemini-flash-1.5",
    "mistralai/mistral-7b-instruct",
    "meta-llama/llama-3-8b-instruct",
]


def _parse_json_response(text: str) -> dict:
    """Robustly parse a JSON response, stripping markdown fences if needed."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        lines = lines[1:]  # drop opening fence (```json or ```)
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]  # drop closing fence
        text = "\n".join(lines).strip()
    return json.loads(text)


def call_llm(prompt: str, max_retries: int = 2) -> dict:
    """Call OpenRouter API, trying multiple models with fallback."""
    last_error = None

    for model_name in MODEL_NAMES:
        for attempt in range(max_retries):
            try:
                response = _client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a precise skill extraction engine. "
                                "Always respond with valid JSON only. "
                                "No markdown, no code fences, no explanation."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.1,
                    max_tokens=2000,
                    response_format={"type": "json_object"},
                )

                raw_text = response.choices[0].message.content or ""
                return _parse_json_response(raw_text)

            except json.JSONDecodeError as e:
                last_error = e
                break  # Bad JSON from this model — try next

            except Exception as e:
                last_error = e
                err_str = str(e).lower()

                # Rate limit — wait and retry same model
                if "429" in err_str or "rate" in err_str or "quota" in err_str:
                    if attempt < max_retries - 1:
                        time.sleep(10)
                    else:
                        break  # Try next model

                # Model unavailable / auth — skip to next model immediately
                elif (
                    "402" in err_str  # insufficient credits
                    or "404" in err_str
                    or "invalid" in err_str
                    or "not found" in err_str
                    or "403" in err_str
                ):
                    break

                # Transient network error
                elif attempt < max_retries - 1:
                    time.sleep(2)
                else:
                    break

    raise RuntimeError(
        f"LLM API call failed after trying all models. Last error: {last_error}"
    )


def extract_skills_and_gaps(resume_text: str, jd_text: str, catalog: list) -> dict:
    catalog_names = [c["skill"] for c in catalog[:40]]
    catalog_str = ", ".join(catalog_names)

    prompt = f"""You are a precise skill extraction engine. Analyze the resume and job description below.
You MUST only reference skills that exist in the provided skill catalog. Do NOT invent skills outside the catalog.

SKILL CATALOG:
{catalog_str}

RESUME TEXT:
{resume_text[:3000]}

JOB DESCRIPTION:
{jd_text[:2000]}

INSTRUCTIONS:
1. Extract skills found in the resume that match the catalog. For each, estimate proficiency level (beginner/intermediate/advanced) and approximate years of experience.
2. Extract skills required by the job description that match the catalog. For each, assign a priority (high/medium/low) and a required_level.
3. Identify skill gaps: skills required by the JD but missing or insufficient in the resume. For each, provide the catalog_skill it maps to, a gap_severity score from 0.0 to 1.0 (1.0 = completely missing), and a brief reason.
4. Write a reasoning_trace explaining step-by-step how you identified the skill gaps.
5. Compute a match_score from 0.0 to 1.0 indicating overall resume-to-JD fit.

Return ONLY a valid JSON object with EXACTLY this structure:

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

    return call_llm(prompt)


# Alias kept for backward compatibility with router imports
def call_gemini(prompt: str, max_retries: int = 2) -> dict:
    return call_llm(prompt, max_retries)
