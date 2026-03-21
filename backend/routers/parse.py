from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import fitz  # PyMuPDF
from docx import Document
import io

router = APIRouter()

class TextPayload(BaseModel):
    text: str

def extract_text_from_pdf(content: bytes) -> str:
    """Extracts text from a PDF file byte stream."""
    text = ""
    with fitz.open(stream=content, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text()
    return text.strip()

def extract_text_from_docx(content: bytes) -> str:
    """Extracts text from a DOCX file byte stream."""
    doc = Document(io.BytesIO(content))
    text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
    return text.strip()

@router.post("/resume")
async def parse_resume(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename.lower()
    
    try:
        if filename.endswith(".pdf"):
            extracted_text = extract_text_from_pdf(content)
        elif filename.endswith(".docx"):
            extracted_text = extract_text_from_docx(content)
        else:
            raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract text from resume: {str(e)}")
    
    if not extracted_text:
        raise HTTPException(status_code=422, detail="Could not extract any text from the uploaded file. Please ensure the file is not empty or image-only.")
    
    return {
        "filename": file.filename,
        "text": extracted_text,
        "char_count": len(extracted_text)
    }

@router.post("/job-description")
async def parse_job_description(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename.lower()
    
    try:
        if filename.endswith(".pdf"):
            extracted_text = extract_text_from_pdf(content)
        elif filename.endswith(".docx"):
            extracted_text = extract_text_from_docx(content)
        else:
            raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract text from job description: {str(e)}")
    
    if not extracted_text:
        raise HTTPException(status_code=422, detail="Could not extract any text from the uploaded file. Please ensure the file is not empty or image-only.")
    
    return {
        "filename": file.filename,
        "text": extracted_text
    }

@router.post("/jd-text")
async def parse_jd_text(payload: TextPayload):
    return {
        "text": payload.text,
        "source": "pasted"
    }
