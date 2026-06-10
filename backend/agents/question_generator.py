from groq import Groq
from core.config import get_settings
from core.vector_store import get_relevant_context
import os
from dotenv import load_dotenv
load_dotenv()

settings = get_settings()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_questions(
    session_id: int,
    company_name: str,
    role: str,
    job_description: str,
    num_questions: int = 5
) -> str:

    context = get_relevant_context(
        session_id,
        query=f"{role} interview questions {company_name}",
        n_results=3
    )

    if not context:
        context = "No additional context available. Use job description only."

    prompt = f"""You are an expert interview coach preparing a candidate for a {role} role at {company_name}.

Here is relevant context gathered from real interview experiences and research:
{context}

Job Description:
{job_description}

Generate exactly {num_questions} targeted interview questions this candidate should prepare for.
Mix behavioral and technical questions specific to this role and company.
For each question explain in one sentence why this company would likely ask it.

Format each question as:
1. [Question]
Why: [Reason]
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "user", "content": prompt}
        ],
        max_tokens=2000,
        temperature=0.7
    )

    return response.choices[0].message.content