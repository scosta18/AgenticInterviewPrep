import ollama
from config import MODEL_NAME, COMPANY_NAME, INTERVIEWER_NAME, COMPANY_CONTEXT, INTERVIEWER_TITLE

def load_job_description():
    with open("data/job_description.txt", "r") as f:
        return f.read()

def generate_questions():
    job_description = load_job_description()

    prompt = f"""
You are preparing a candidate for a job interview at {COMPANY_NAME}.

Here is context about the company and interviewer:
{COMPANY_CONTEXT}

Here is the job description:
{job_description}

Generate 5 targeted interview questions this candidate should prepare for.
Mix behavioral questions and technical questions relevant to this specific role.
For each question, explain in one sentence why this company would likely ask it.
"""

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": f"You are an expert interview coach preparing someone to interview with {INTERVIEWER_NAME}, {INTERVIEWER_TITLE} of {COMPANY_NAME}."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response['message']['content']

if __name__ == "__main__":
    print("Generating interview questions for", COMPANY_NAME)
    print("-" * 50)
    print(generate_questions())