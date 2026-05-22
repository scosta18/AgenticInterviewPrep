import os
import chromadb
from chromadb.utils import embedding_functions
from core.config import get_settings

settings = get_settings()

embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

def get_client():
    os.makedirs(settings.chroma_path, exist_ok=True)
    return chromadb.PersistentClient(path=settings.chroma_path)

def get_or_create_collection(name: str):
    client = get_client()
    return client.get_or_create_collection(
        name=name,
        embedding_function=embedding_fn
    )

def store_job_context(session_id: int, job_description: str, company_context: str):
    collection = get_or_create_collection(f"session_{session_id}")
    collection.add(
        documents=[job_description, company_context or "No additional context"],
        ids=[f"jd_{session_id}", f"ctx_{session_id}"],
        metadatas=[
            {"type": "job_description", "session_id": session_id},
            {"type": "company_context", "session_id": session_id}
        ]
    )
    print(f"✅ Stored job context for session {session_id}")

def get_relevant_context(session_id: int, query: str, n_results: int = 3) -> str:
    collection = get_or_create_collection(f"session_{session_id}")
    results = collection.query(
        query_texts=[query],
        n_results=n_results
    )
    if results and results['documents']:
        return "\n\n".join(results['documents'][0])
    return ""

def store_scraped_data(session_id: int, scraped_texts: list):
    collection = get_or_create_collection(f"session_{session_id}")
    documents = []
    ids = []
    metadatas = []

    for i, text in enumerate(scraped_texts):
        if text and len(text.strip()) > 50:
            documents.append(text)
            ids.append(f"scraped_{session_id}_{i}")
            metadatas.append({"type": "scraped", "session_id": session_id})

    if documents:
        collection.add(documents=documents, ids=ids, metadatas=metadatas)
        print(f"✅ Stored {len(documents)} scraped documents")
# import chromadb
# from chromadb.utils import embedding_functions
# from core.config import get_settings

# settings = get_settings()

# embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
#     model_name="all-MiniLM-L6-v2"
# )

# def get_clients():
#     return chromadb.ParsistentClient(path=settings.chroma_path)


# def get_or_create_collections(name: str):
#     client = get_clients()
#     return client.get_or_create_collection(name=name, embedding_functions=embedding_fn)


# def store_job_context(session_id: int, job_description: str, company_context: str):
#     collection = get_or_create_collections(f'session_{session_id}')
    
#     collection.add(
#         documents=[job_description, company_context],
#         ids=[f"js_{session_id}", f"ctx_{session_id}"],
#         metadatas=[{
#             "type": "job_description", "session_id": session_id
#         },{
#             "type": "company_context", "session_id": session_id
#         }
#         ]
#     )
#     print(f"Stored job context for sessions {session_id}")
    
    
# def get_relevant_context(session_id: int, query: str, n_result: int = 3) -> str:
#     collection = get_or_create_collections(f'session_{session_id}')
#     results = collection.query(
#         query_texts=[query],
#         n_results= n_result
#     )
    
#     if results and results['documents']:
#         return "\n\n".join(results['documents'][0])
    
    
# def store_scraped_data(session_id: int, scraped_texts: list):
#     collection = get_or_create_collections(f'session_{session_id}')
    
#     documents = []
#     ids = []
#     metadatas = []
    
#     for i, text in enumerate(scraped_texts):
#         if text and len(text.strip()) > 50:
#             documents.append(text)
#             ids.append(f"scraped_{session_id}_{i}")
#             metadatas.append({"type": "scraped_text", "session_id": session_id})
            
#     if documents:
#         collection.add(
#             documents=documents,
#             ids=ids,
#             metadatas=metadatas
#         )
#         print(f"Stored {len(documents)} scraped documents")