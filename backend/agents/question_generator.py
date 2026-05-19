from langchain_community.llms import Ollama
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from core.config import get_settings
from core.vectore_store import get_relevant_context

settings = get_settings()

llm = Ollama(model=settings.model_name)

question_prompt = PromptTemplate(
    input_variables=["company", "role", "context", "job_description"],
    template="""
    You are an expert interview coach preparing a candidate for a {role} role at {company} company.
    
    Here is relevant context gathered from real interview experience and research:
    {context}
    
    Job Description:
    {job_description}
    
    Generate exactly 5 targeted interview questions this candidate should prepare for. Mix behavioral and technical
    specific to this role and company.
    For each question explain in one sentence why this company would likely ask it.
    
    1. [Question]
    Why: [Reason]
    """
)

def generate_question(
    session_id: int,
    company_name: str,
    role: str,
    job_description: str
) -> str:
    """Generate targeted interview question using RAG contxt"""
    context = get_relevant_context(session_id,
                                   query=f"{role} interview questions {company_name}",
                                   n_results=3
                                   )
    if not context:
        context = "No additional context available. Use job description only."
        
    chain = LLMChain(llm=llm, prompt=question_prompt)
    
    result = chain.invoke({
        "company": company_name,
        "role": role,
        "context": context,
        "job_description": job_description
    })
    
    return result['text']
    


























# 
# import ollama
# from config import MODEL_NAME, COMPANY_NAME, INTERVIEWER_NAME, COMPANY_CONTEXT, INTERVIEWER_TITLE

# def load_job_description():
#     with open("data/job_description.txt", "r") as f:
#         return f.read()

# def generate_questions():
#     job_description = load_job_description()

#     prompt = f"""
# You are preparing a candidate for a job interview at {COMPANY_NAME}.

# Here is context about the company and interviewer:
# {COMPANY_CONTEXT}

# Here is the job description:
# {job_description}

# Generate 5 targeted interview questions this candidate should prepare for.
# Mix behavioral questions and technical questions relevant to this specific role.
# For each question, explain in one sentence why this company would likely ask it.
# """

#     response = ollama.chat(
#         model=MODEL_NAME,
#         messages=[
#             {
#                 "role": "system",
#                 "content": f"You are an expert interview coach preparing someone to interview with {INTERVIEWER_NAME}, {INTERVIEWER_TITLE} of {COMPANY_NAME}."
#             },
#             {
#                 "role": "user",
#                 "content": prompt
#             }
#         ]
#     )

#     return response['message']['content']

# if __name__ == "__main__":
#     print("Generating interview questions for", COMPANY_NAME)
#     print("-" * 50)
#     print(generate_questions())