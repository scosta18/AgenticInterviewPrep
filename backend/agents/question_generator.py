from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate
from core.config import get_settings
from core.vector_store import get_relevant_context

settings = get_settings()

llm = Ollama(model=settings.model_name)

question_prompt = PromptTemplate(
    input_variables=["company", "role", "context", "job_description", "num_questions"],
    template="""
You are an expert interview coach preparing a candidate for a {role} role at {company}.

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
)

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

    chain = question_prompt | llm
    result = chain.invoke({
        "company": company_name,
        "role": role,
        "context": context,
        "job_description": job_description,
        "num_questions": num_questions
    })

    return result