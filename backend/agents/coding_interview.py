import re
import json
from groq import Groq
from core.config import get_settings
import os
from dotenv import load_dotenv
load_dotenv()

settings = get_settings()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def _extract_json(text: str) -> dict:
    """Groq sometimes wraps JSON in prose or ```json fences. Pull the object out safely."""
    cleaned = text.replace("```json", "").replace("```", "").strip()
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        cleaned = match.group(0)
    return json.loads(cleaned)


def _extract_score(feedback_text: str) -> int:
    """Extract X/10 score from feedback text."""
    match = re.search(r'(\d+)\s*/\s*10', feedback_text)
    if match:
        return int(match.group(1))
    return 0


def generate_problem(
    role: str = "the role",
    company_name: str = "the company",
    job_description: str = "",
    difficulty: str = "medium",
) -> dict:
    """Generate a LeetCode-style coding problem targeted to the role."""

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


def review_code(
    problem_title: str,
    problem_description: str,
    code: str,
    language: str,
    transcript: str = "",
) -> tuple[str, int]:
    """Groq reviews the submitted solution based on thinking and approach."""

    transcript_block = (
        f"\nCandidate's spoken reasoning (think-aloud):\n{transcript}\n"
        if transcript else ""
    )

    prompt = f"""You are evaluating a candidate's solution to a coding interview problem.
Focus on their thinking and approach, not just whether the code runs.

Problem: {problem_title}
{problem_description}

Language: {language}

Candidate's code:
{code}
{transcript_block}
Provide structured feedback:
1. Score: X/10 (40% correctness of approach, 30% code quality, 30% communication if transcript present)
2. Approach: Did they understand the problem? Is their strategy sound?
3. Code Quality: readability, naming, structure, edge cases considered
4. Communication: comment on their reasoning if a transcript is present
5. Stronger Approach: briefly describe a better solution if one exists

Be brutally honest, with a motivating close. Focus on thinking process over syntax."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1200,
        temperature=0.7,
    )

    result = response.choices[0].message.content
    score = _extract_score(result)
    return result, score


def generate_hint(problem_title: str, problem_description: str, code: str, language: str) -> str:
    """Generate a nudge stule hint without giving away the answer"""
    prompt = f"""You are a technical interviewer giving a hint to a candidate who is stuck
    Do NOT give away the solution. Give a nudge that helps them think in the righ direction.
    
    Problem: {problem_title}
    {problem_description}
    
    Candidate's current code ({language}):
    {code}
    
    Give a single, concise hint (2-3 sentances max). Focus on:
    - What concept or pattern they should think about
    - A question that guides their thinking
    - What edge case or step they might be missing
    
    Do not write any code. Do not reveal the answer.
    """
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
        temperature=0.7,
    )
    
    return response.choices[0].message.content

def choose_next_difficulty(score: int, current_difficulty: int) -> dict:
    """Decide next problem difficulty based on score. The agentic step."""
    difficulty_order = ['easy', 'medium', 'hard']
    current_index = difficulty_order.index(current_difficulty) if current_difficulty in difficulty_order else 1
    
    if score >= 8:
        next_index = min(current_index + 1, 2)
        if next_index == current_index:
            message = "Outstanding! You're already at the hardest level. Let's keep pushing."
        else:
            message = f"Great work! Moving up to {difficulty_order[next_index]}"
    elif score >= 5:
        next_index = current_index
        message = f"Good effort. Staying at {difficulty_order[next_index]} to solidify your skills"
    else:
        next_index = max(current_index - 1, 0)
        if next_index == current_index:
            message = "Keep practicing. Let's work through some more easy problems"
        else:
            message = f"Let's step back to {difficulty_order[next_index]} and build confidence."
            
    return {
        "next_difficulty": difficulty_order[next_index],
        "message": message,
        "score": score,
        "previous_difficulty": current_difficulty,
    }