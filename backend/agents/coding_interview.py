import re
import json
from groq import Groq
from core.config import get_settings
import os
from dotenv import load_dotenv
load_dotenv()

settings = get_settings()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Piston public API — free, sandboxed code execution, no auth
PISTON_URL = "https://emkc.org/api/v2/piston/execute"

# Language -> (piston language, version, starter stub)
LANG_CONFIG = {
    "python": {"language": "python", "version": "3.10.0"},
    "javascript": {"language": "javascript", "version": "18.15.0"},
    "java": {"language": "java", "version": "15.0.2"},
    "cpp": {"language": "c++", "version": "10.2.0"},
}


def _extract_json(text: str) -> dict:
    """Groq sometimes wraps JSON in prose or ```json fences. Pull the object out safely."""
    cleaned = text.replace("```json", "").replace("```", "").strip()
    # Grab the outermost {...} if there's surrounding prose
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        cleaned = match.group(0)
    return json.loads(cleaned)


def generate_problem(
    role: str = "the role",
    company_name: str = "the company",
    job_description: str = "",
    difficulty: str = "medium",
) -> dict:
    """Generate a LeetCode-style coding problem targeted to the role. Returns a dict."""

    prompt = f"""You are a technical interviewer creating a coding problem for a {role} candidate at {company_name}.

Job description context:
{job_description or "No job description provided."}

Generate ONE {difficulty}-difficulty LeetCode-style coding problem relevant to this role.

Respond with ONLY a valid JSON object (no markdown, no prose, no backticks) in this exact shape:
{{
  "title": "Short problem title",
  "difficulty": "{difficulty}",
  "description": "Clear problem statement, 2-4 sentences.",
  "examples": [
    {{"input": "example input", "output": "expected output", "explanation": "why"}}
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "function_signature": {{
    "python": "def solution(...):",
    "javascript": "function solution(...) {{}}",
    "java": "public static ReturnType solution(ParamType param) {{}}",
    "cpp": "ReturnType solution(ParamType param) {{}}"
  }},
  "test_cases": [
    {{"input": "...", "expected": "..."}}
  ]
}}

Make the problem solvable in 15-20 minutes. Keep test_cases concrete and checkable."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1500,
        temperature=0.7,
    )

    raw = response.choices[0].message.content
    try:
        problem = _extract_json(raw)
    except Exception:
        # Fallback so the endpoint never hard-fails on a parse error
        problem = {
            "title": "Problem (parse fallback)",
            "difficulty": difficulty,
            "description": raw[:600],
            "examples": [],
            "constraints": [],
            "function_signature": {"python": "def solution():"},
            "test_cases": [],
        }
    return problem


async def execute_code(code: str, language: str = "python", stdin: str = "") -> dict:
    """Run code in the Piston sandbox. Async to match the rest of the backend."""
    import httpx

    cfg = LANG_CONFIG.get(language.lower())
    if not cfg:
        return {"success": False, "error": f"Unsupported language: {language}"}

    payload = {
        "language": cfg["language"],
        "version": cfg["version"],
        "files": [{"content": code}],
        "stdin": stdin,
    }

    try:
        async with httpx.AsyncClient(timeout=20) as http:
            resp = await http.post(PISTON_URL, json=payload)
            if resp.status_code != 200:
                return {"success": False, "error": f"Piston returned {resp.status_code}"}
            data = resp.json()
            run = data.get("run", {})
            return {
                "success": run.get("code", 1) == 0,
                "stdout": run.get("stdout", ""),
                "stderr": run.get("stderr", ""),
                "output": run.get("output", ""),
                "exit_code": run.get("code"),
            }
    except Exception as e:
        return {"success": False, "error": str(e)}


def review_code(
    problem_title: str,
    problem_description: str,
    code: str,
    language: str,
    execution_result: dict,
    transcript: str = "",
) -> tuple[str, int]:
    """Groq reviews the submitted solution. Returns (feedback_text, score). Mirrors get_feedback()."""

    exec_summary = "Code did not run." if not execution_result else (
        f"Exit code: {execution_result.get('exit_code')}\n"
        f"Stdout: {execution_result.get('stdout', '')[:500]}\n"
        f"Stderr: {execution_result.get('stderr', '')[:500]}"
    )

    transcript_block = (
        f"\nCandidate's spoken reasoning (think-aloud):\n{transcript}\n"
        if transcript else ""
    )

    prompt = f"""You are evaluating a candidate's solution to a coding interview problem.

Problem: {problem_title}
{problem_description}

Language: {language}

Candidate's code:
{code}

Execution result:
{exec_summary}
{transcript_block}
Provide structured feedback:
1. Score: X/10 (correctness first, then efficiency and clarity; if it doesn't run or is wrong, score low)
2. Correctness: did it solve the problem? Edge cases missed?
3. Complexity: time and space, and whether it can be improved
4. Code Quality: readability, naming, structure
5. Communication: comment on their reasoning if a transcript is present
6. Stronger Approach: briefly describe a better solution if one exists

Be brutally honest, with a motivating close. Focus on what matters for a real technical interview."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1200,
        temperature=0.7,
    )

    result = response.choices[0].message.content
    score = _extract_score(result)
    return result, score


def _extract_score(feedback_text: str) -> int:
    """Same X/10 extraction approach as feedback_engine.extract_score."""
    match = re.search(r'(\d+)\s*/\s*10', feedback_text)
    if match:
        return int(match.group(1))
    return 0

# import re
# import json
# from groq import Groq
# from core.config import get_settings
# import os
# from dotenv import load_dotenv
# load_dotenv()

# settings = get_settings()
# client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# # Piston public API — free, sandboxed code execution, no auth
# PISTON_URL = "https://emkc.org/api/v2/piston/execute"

# # Language -> (piston language, version, starter stub)
# LANG_CONFIG = {
#     "python": {"language": "python", "version": "3.10.0"},
#     "javascript": {"language": "javascript", "version": "18.15.0"},
#     "java": {"language": "java", "version": "15.0.2"},
#     "cpp": {"language": "c++", "version": "10.2.0"},
# }


# def _extract_json(text: str) -> dict:
#     """Groq sometimes wraps JSON in prose or ```json fences. Pull the object out safely."""
#     cleaned = text.replace("```json", "").replace("```", "").strip()
#     # Grab the outermost {...} if there's surrounding prose
#     match = re.search(r"\{.*\}", cleaned, re.DOTALL)
#     if match:
#         cleaned = match.group(0)
#     return json.loads(cleaned)


# def generate_problem(
#     role: str = "the role",
#     company_name: str = "the company",
#     job_description: str = "",
#     difficulty: str = "medium",
# ) -> dict:
#     """Generate a LeetCode-style coding problem targeted to the role. Returns a dict."""

#     prompt = f"""You are a technical interviewer creating a coding problem for a {role} candidate at {company_name}.

# Job description context:
# {job_description or "No job description provided."}

# Generate ONE {difficulty}-difficulty LeetCode-style coding problem relevant to this role.

# Respond with ONLY a valid JSON object (no markdown, no prose, no backticks) in this exact shape:
# {{
#   "title": "Short problem title",
#   "difficulty": "{difficulty}",
#   "description": "Clear problem statement, 2-4 sentences.",
#   "examples": [
#     {{"input": "example input", "output": "expected output", "explanation": "why"}}
#   ],
#   "constraints": ["constraint 1", "constraint 2"],
#   "function_signature": {{
#     "python": "def solution(...):",
#     "javascript": "function solution(...) {{}}"
#   }},
#   "test_cases": [
#     {{"input": "...", "expected": "..."}}
#   ]
# }}

# Make the problem solvable in 15-20 minutes. Keep test_cases concrete and checkable."""

#     response = client.chat.completions.create(
#         model="llama-3.3-70b-versatile",
#         messages=[{"role": "user", "content": prompt}],
#         max_tokens=1500,
#         temperature=0.7,
#     )

#     raw = response.choices[0].message.content
#     try:
#         problem = _extract_json(raw)
#     except Exception:
#         # Fallback so the endpoint never hard-fails on a parse error
#         problem = {
#             "title": "Problem (parse fallback)",
#             "difficulty": difficulty,
#             "description": raw[:600],
#             "examples": [],
#             "constraints": [],
#             "function_signature": {"python": "def solution():"},
#             "test_cases": [],
#         }
#     return problem


# async def execute_code(code: str, language: str = "python", stdin: str = "") -> dict:
#     """Run code in the Piston sandbox. Async to match the rest of the backend."""
#     import httpx

#     cfg = LANG_CONFIG.get(language.lower())
#     if not cfg:
#         return {"success": False, "error": f"Unsupported language: {language}"}

#     payload = {
#         "language": cfg["language"],
#         "version": cfg["version"],
#         "files": [{"content": code}],
#         "stdin": stdin,
#     }

#     try:
#         async with httpx.AsyncClient(timeout=20) as http:
#             resp = await http.post(PISTON_URL, json=payload)

#             print("STATUS:", resp.status_code)
#             print("BODY:", resp.text)

#             if resp.status_code != 200:
#                 return {
#                     "success": False,
#                     "error": f"Piston returned {resp.status_code}",
#                     "details": resp.text
#                 }
#             data = resp.json()
#             run = data.get("run", {})
#             return {
#                 "success": run.get("code", 1) == 0,
#                 "stdout": run.get("stdout", ""),
#                 "stderr": run.get("stderr", ""),
#                 "output": run.get("output", ""),
#                 "exit_code": run.get("code"),
#             }
#     except Exception as e:
#         return {"success": False, "error": str(e)}


# def review_code(
#     problem_title: str,
#     problem_description: str,
#     code: str,
#     language: str,
#     execution_result: dict,
#     transcript: str = "",
# ) -> tuple[str, int]:
#     """Groq reviews the submitted solution. Returns (feedback_text, score). Mirrors get_feedback()."""

#     exec_summary = "Code did not run." if not execution_result else (
#         f"Exit code: {execution_result.get('exit_code')}\n"
#         f"Stdout: {execution_result.get('stdout', '')[:500]}\n"
#         f"Stderr: {execution_result.get('stderr', '')[:500]}"
#     )

#     transcript_block = (
#         f"\nCandidate's spoken reasoning (think-aloud):\n{transcript}\n"
#         if transcript else ""
#     )

#     prompt = f"""You are evaluating a candidate's solution to a coding interview problem.

# Problem: {problem_title}
# {problem_description}

# Language: {language}

# Candidate's code:
# {code}

# Execution result:
# {exec_summary}
# {transcript_block}
# Provide structured feedback:
# 1. Score: X/10 (correctness first, then efficiency and clarity; if it doesn't run or is wrong, score low)
# 2. Correctness: did it solve the problem? Edge cases missed?
# 3. Complexity: time and space, and whether it can be improved
# 4. Code Quality: readability, naming, structure
# 5. Communication: comment on their reasoning if a transcript is present
# 6. Stronger Approach: briefly describe a better solution if one exists

# Be brutally honest, with a motivating close. Focus on what matters for a real technical interview."""

#     response = client.chat.completions.create(
#         model="llama-3.3-70b-versatile",
#         messages=[{"role": "user", "content": prompt}],
#         max_tokens=1200,
#         temperature=0.7,
#     )

#     result = response.choices[0].message.content
#     score = _extract_score(result)
#     return result, score


# def _extract_score(feedback_text: str) -> int:
#     """Same X/10 extraction approach as feedback_engine.extract_score."""
#     match = re.search(r'(\d+)\s*/\s*10', feedback_text)
#     if match:
#         return int(match.group(1))
#     return 0