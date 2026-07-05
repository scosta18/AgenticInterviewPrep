import os
import io
import fitz
from docx import Document
from fastapi import UploadFile, HTTPException

MAX_FILE_SIZE = 5 * 1024 * 1024

ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.doc', '.txt'}


async def extract_resume_text(file: UploadFile) -> str:
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max size is 5MB")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, DOCX or TXT.")

    content = await file.read()

    try:
        text = ""
        if ext == '.pdf':
            pdf = fitz.open(stream=content, filetype='pdf')
            for page in pdf:
                text += page.get_text()
            pdf.close()
        elif ext in ('.docx', '.doc'):
            doc = Document(io.BytesIO(content))
            text = "\n".join([para.text for para in doc.paragraphs])
        elif ext == '.txt':
            text = content.decode('utf-8', errors='ignore')
        else:
            text = ""

        text = text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from file. Make sure it's not a scanned image.")

        return text[:5000]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")