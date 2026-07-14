from groq import Groq
from core.config import get_settings
from core.vector_store import get_relevant_context
import os
from dotenv import load_dotenv
load_dotenv()

settings = get_settings()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def _build_prompt(
    interview_type: str,
    company_name: str,
    role: str,
    job_description: str,
    num_questions: int,
    context: str,
    resume_block: str,
) -> str:

    base = f"""You are an expert interview coach preparing a candidate for a {role} role at {company_name}.

Here is relevant context gathered from real interview experiences and research:
{context}

Job Description:
{job_description}
{resume_block}"""

    if interview_type == "case":
        return base + f"""
You are preparing a candidate for a CASE INTERVIEW at {company_name}.
Case interviews are used by consulting firms to test business problem-solving, structured thinking, and communication.

Generate exactly {num_questions} case interview prompts. Each should be a realistic business problem.
For each case, include:
- The business scenario (2-3 sentences)
- The core question the candidate must answer
- One hint about what framework might apply (e.g. profitability, market entry, M&A)

Format each as:
1. [Case Title]
Scenario: [Business situation]
Question: [What the candidate must solve]
Framework hint: [e.g. Profitability framework]
"""

    if interview_type == "product":
        return base + f"""
You are preparing a candidate for a PRODUCT SENSE INTERVIEW at {company_name}.
Product sense interviews test user empathy, product thinking, prioritization, and metrics.

Generate exactly {num_questions} product sense interview questions.
Mix question types: product design, product improvement, favorite product, metrics/analysis.
{f"Tailor to the candidate's background from their resume." if resume_block else ""}

Format each as:
1. [Question]
Why: [Why this tests product sense for this role]
"""

    if interview_type == "system_design":
        return base + f"""
You are preparing a candidate for a SYSTEM DESIGN INTERVIEW at {company_name}.
System design interviews test technical architecture, scalability, tradeoffs, and engineering judgment.

Generate exactly {num_questions} system design questions relevant to {role} at {company_name}.
Range from foundational (URL shortener, rate limiter) to complex (distributed cache, notification system).
{f"Tailor to the candidate's technical background from their resume." if resume_block else ""}

Format each as:
1. [System to design]
Scale: [Expected scale, e.g. 10M users/day]
Key challenge: [Main engineering challenge to address]
Why: [Why this company would ask this]
"""

    # Default: behavioral
    return base + f"""
Generate exactly {num_questions} targeted interview questions this candidate should prepare for.
Mix behavioral and technical questions specific to this role and company.
{f"Tailor questions to the candidate's background and experience from their resume." if resume_block else ""}
For each question explain in one sentence why this company would likely ask it.

Format each question as:
1. [Question]
Why: [Reason]
"""


def generate_questions(
    session_id: int,
    company_name: str,
    role: str,
    job_description: str,
    num_questions: int = 5,
    resume_text: str = "",
    interview_type: str = "behavioral",
) -> str:

    context = get_relevant_context(
        session_id,
        query=f"{role} interview questions {company_name}",
        n_results=3
    )

    if not context:
        context = "No additional context available. Use job description only."

    resume_block = f"\nCandidate's Resume:\n{resume_text}\n" if resume_text else ""

    prompt = _build_prompt(
        interview_type=interview_type,
        company_name=company_name,
        role=role,
        job_description=job_description,
        num_questions=num_questions,
        context=context,
        resume_block=resume_block,
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000,
        temperature=0.7
    )

    return response.choices[0].message.content