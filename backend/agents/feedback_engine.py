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

def _build_feedback_prompt(
    interview_type: str,
    question: str,
    answer: str,
    company_name: str,
    role: str,
) -> str:
 
    if interview_type == "case":
        return f"""You are evaluating a candidate's case interview response for a {role} position at {company_name}.
 
Case Question:
{question}
 
Candidate's Answer:
{answer}
 
Provide structured feedback:
1. Score: X/10 (score 0 if they didn't attempt a structured answer)
2. Structure: Did they use a clear framework? Was it logical?
3. Business Sense: Did they identify the right drivers and levers?
4. Communication: Was the answer clear, concise, and well-organized?
5. Improvements: What would a top consultant do differently?
6. Stronger Approach: [Briefly outline a model answer structure]
 
Be direct and specific. Focus on consulting interview standards."""
 
    if interview_type == "product":
        return f"""You are evaluating a candidate's product sense interview response for a {role} position at {company_name}.
 
Product Question:
{question}
 
Candidate's Answer:
{answer}
 
Provide structured feedback:
1. Score: X/10 (score 0 if the answer lacks any product thinking)
2. User Empathy: Did they identify and understand the user?
3. Problem Framing: Did they clarify scope and define the problem well?
4. Solution Quality: Were the solutions creative, feasible, and user-focused?
5. Metrics: Did they define success metrics?
6. Improvements: What would a strong PM candidate do differently?
7. Stronger Approach: [Outline what an excellent answer looks like]
 
Be direct. Focus on PM interview standards at top tech companies."""
 
    if interview_type == "system_design":
        return f"""You are evaluating a candidate's system design interview response for a {role} position at {company_name}.
 
System Design Question:
{question}
 
Candidate's Answer:
{answer}
 
Provide structured feedback:
1. Score: X/10 (score 0 if they didn't attempt any design)
2. Requirements Gathering: Did they clarify functional and non-functional requirements?
3. High-Level Design: Did they propose a reasonable architecture?
4. Component Design: Did they go deep on key components?
5. Scalability: Did they address scale, bottlenecks, and tradeoffs?
6. Improvements: What did they miss or handle poorly?
7. Stronger Approach: [Outline the key components of a strong answer]
 
Be direct. Focus on senior engineering interview standards."""
 
    # Default: behavioral
    return f"""You are evaluating a candidate's interview answer for a {role} position at {company_name}.
 
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
 
Be brutally honest, with motivation at the end. Focus on what matters for this specific role."""

def get_feedback(
    question: str,
    answer: str,
    company_name: str = "the company",
    role: str = "the role",
    interview_type: str = "behavioral",
) -> tuple[str, int]:

    prompt = _build_feedback_prompt(
        interview_type=interview_type,
        question=question,
        answer=answer,
        company_name=company_name,
        role=role,
    )
 
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
        temperature=0.7
    )
 
    result = response.choices[0].message.content
    score = extract_score(result)
    return result, score