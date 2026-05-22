import re
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate
# from langchain.chains import LLMChain
from core.config import get_settings


settings = get_settings()

llm = Ollama(model=settings.model_name)

feedback_prompt = PromptTemplate(
    input_variables = ["company", "role", "questions", "answer"],
    template="""
    You are evaluating a candidate's interview answer for a {role} position at {company}.

        Interview Question:
        {question}

        Candidate's Answer:
        {answer}

        Provide structured feedback:
        1. Score: X/10
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
    
)


def extract_score(feedback_text: str) -> int:
    """Extract numerical score from feedback"""
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
    chain = feedback_prompt | llm
    result = chain.invoke({
        "company": company_name,
        "role": role,
        "question": question,
        "answer": answer
    })
    score = extract_score(result)
    return result, score









# import ollama
# from config import MODEL_NAME, COMPANY_NAME, INTERVIEWER_NAME, COMPANY_CONTEXT

# def get_feedback(question, answer):

#     prompt = f"""
# You are evaluating a candidate's interview answer for a role at {COMPANY_NAME}.

# Company context:
# {COMPANY_CONTEXT}

# Interview question asked:
# {question}

# Candidate's answer:
# {answer}

# Please evaluate the answer and provide:
# 1. A score out of 10
# 2. What they did well (2-3 bullet points)
# 3. What they should improve (2-3 bullet points)
# 4. A suggested stronger version of their answer in 3-4 sentences

# Be truthful,honest, and encouraging but do no suger coatingfeedback_engine. This candidate is early in their career.
# """

#     response = ollama.chat(
#         model=MODEL_NAME,
#         messages=[
#             {
#                 "role": "system",
#                 "content": f"You are an expert interview coach helping someone prepare to interview with {INTERVIEWER_NAME}, {COMPANY_NAME}."
#             },
#             {
#                 "role": "user",
#                 "content": prompt
#             }
#         ]
#     )

#     return response['message']['content']