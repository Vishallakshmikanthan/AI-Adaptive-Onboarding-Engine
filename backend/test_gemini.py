"""
test_gemini.py — Quick connection test for Google Gemini API.

Run:   python test_gemini.py
Expected: {"status": "ok", "message": "Gemini is connected"}
"""
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"


def main():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print(f"{RED}ERROR: GEMINI_API_KEY not found in environment.{RESET}")
        print("Fix: Add GEMINI_API_KEY=your_key to backend/.env")
        return

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config=genai.GenerationConfig(
            temperature=0.0,
            max_output_tokens=100,
            response_mime_type="application/json",
        ),
    )

    prompt = (
        'Return ONLY a valid JSON object. No explanation, no markdown, '
        'no code fences, no preamble. Start your response directly with {\n\n'
        '{"status": "ok", "message": "Gemini is connected"}'
    )

    try:
        response = model.generate_content(prompt)
        result = json.loads(response.text)
        print(f"{GREEN}SUCCESS: Gemini is connected!{RESET}")
        print(json.dumps(result, indent=2))
    except json.JSONDecodeError:
        print(f"{RED}ERROR: Gemini responded but returned invalid JSON.{RESET}")
        print(f"Raw response: {response.text[:300]}")
        print("Fix: Ensure your API key has access to gemini-2.0-flash.")
    except Exception as e:
        error_msg = str(e)
        print(f"{RED}ERROR: Gemini API call failed.{RESET}")
        print(f"Details: {error_msg}")
        if "API_KEY_INVALID" in error_msg or "401" in error_msg:
            print("Fix: Check that GEMINI_API_KEY in .env is correct and active.")
        elif "429" in error_msg or "resource_exhausted" in error_msg.lower():
            print("Fix: Rate limited. Wait 60 seconds and try again.")
        else:
            print("Fix: Check your internet connection and API key permissions.")


if __name__ == "__main__":
    main()
