import re
from groq import Groq
from core.config import get_settings
import os
from dotenv import load_dotenv
load_dotenv()

settings = get_settings()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def extract_score(feedback_text: str) -> int:
    match = re.search(r'(\d+)\s*/\s*10', feedback_text)
    if match:
        return int(match.group(1))
    return 0

def get_feedback(
    question: str,
    answer: str,
    company_name: str = "the company",
    role: str = "the role"
) -> tuple[str, int]:

    prompt = f"""You are evaluating a candidate's interview answer for a {role} position at {company_name}.

Interview Question:
{question}

Candidate's Answer:
{answer}

Provide structured feedback:
1. Score: X/10 (if the answer is irrelevant to the question, give a score of 0)
2. Strengths:
- [strength 1]
- [strength 2]
3. Improvements:
- [improvement 1]
- [improvement 2]
4. Stronger Answer:
[Write a better version of their answer in 3-4 sentences]

Be brutally honest, with motivation at the end. Focus on what matters for this specific role.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "user", "content": prompt}
        ],
        max_tokens=1000,
        temperature=0.7
    )

    result = response.choices[0].message.content
    score = extract_score(result)
    return result, score