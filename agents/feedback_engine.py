import ollama
from config import MODEL_NAME, COMPANY_NAME, INTERVIEWER_NAME, COMPANY_CONTEXT

def get_feedback(question, answer):

    prompt = f"""
You are evaluating a candidate's interview answer for a role at {COMPANY_NAME}.

Company context:
{COMPANY_CONTEXT}

Interview question asked:
{question}

Candidate's answer:
{answer}

Please evaluate the answer and provide:
1. A score out of 10
2. What they did well (2-3 bullet points)
3. What they should improve (2-3 bullet points)
4. A suggested stronger version of their answer in 3-4 sentences

Be truthful,honest, and encouraging but do no suger coating. This candidate is early in their career.
"""

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": f"You are an expert interview coach helping someone prepare to interview with {INTERVIEWER_NAME}, {COMPANY_NAME}."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response['message']['content']