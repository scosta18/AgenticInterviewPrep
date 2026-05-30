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

        Be brutally honest, with motivation at the end. Focus on what matters for this specific role, if the answer is irrelevant,
        to the question and the company topic dont give out any score for it.
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
