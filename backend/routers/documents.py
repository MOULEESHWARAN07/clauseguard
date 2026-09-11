from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import tempfile
import os
import uuid
import asyncio
from typing import Dict, List
from pathlib import Path

from services.pdf_service import extract_pdf
from services.ai_service import score_clause, generate_summary
from services.rag_service import build_vector_store, delete_store

router = APIRouter()

# In-memory document store (use DB in production)
documents: Dict[str, Dict] = {}

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a PDF document."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    doc_id = str(uuid.uuid4())

    # Save to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Extract PDF content
        extracted = extract_pdf(tmp_path)

        # Build vector store for RAG
        chunk_count = build_vector_store(doc_id, extracted["full_text"])

        # Score flagged clauses (limit to first 30 for speed)
        clauses = extracted["clauses"]
        flagged_clauses = [c for c in clauses if c.get("is_flagged")][:30]
        other_clauses = [c for c in clauses if not c.get("is_flagged")][:20]

        scored_clauses = []
        for clause in flagged_clauses:
            score_data = await score_clause(clause["text"])
            scored_clauses.append({**clause, **score_data})

        # Add unscored clauses with default score
        for clause in other_clauses:
            scored_clauses.append({
                **clause,
                "risk_score": 1,
                "category": "general",
                "explanation": "No significant risk detected.",
                "flagged": False
            })

        # Generate summary
        summary = await generate_summary(extracted["full_text"])

        # Build risk stats
        risk_stats = build_risk_stats(scored_clauses)

        doc_data = {
            "doc_id": doc_id,
            "filename": file.filename,
            "total_pages": extracted["total_pages"],
            "clauses": scored_clauses,
            "pages": extracted["pages"],
            "summary": summary,
            "risk_stats": risk_stats,
            "chunk_count": chunk_count
        }

        documents[doc_id] = doc_data
        os.unlink(tmp_path)

        return {
            "doc_id": doc_id,
            "filename": file.filename,
            "total_pages": extracted["total_pages"],
            "clause_count": len(scored_clauses),
            "flagged_count": sum(1 for c in scored_clauses if c.get("flagged")),
            "summary": summary,
            "risk_stats": risk_stats
        }

    except Exception as e:
        os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@router.get("/{doc_id}")
async def get_document(doc_id: str):
    """Get processed document data."""
    if doc_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found.")
    doc = documents[doc_id]
    return {
        "doc_id": doc_id,
        "filename": doc["filename"],
        "total_pages": doc["total_pages"],
        "clauses": doc["clauses"],
        "summary": doc["summary"],
        "risk_stats": doc["risk_stats"]
    }

@router.get("/{doc_id}/clauses")
async def get_clauses(doc_id: str, flagged_only: bool = False):
    """Get clauses for a document, optionally filter flagged only."""
    if doc_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found.")
    clauses = documents[doc_id]["clauses"]
    if flagged_only:
        clauses = [c for c in clauses if c.get("flagged")]
    return {"clauses": clauses, "total": len(clauses)}

@router.get("/{doc_id}/pages")
async def get_pages(doc_id: str):
    """Get page data with sentence bboxes."""
    if doc_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"pages": documents[doc_id]["pages"]}

@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document from memory."""
    if doc_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found.")
    del documents[doc_id]
    delete_store(doc_id)
    return {"message": "Document deleted."}

@router.get("/")
async def list_documents():
    """List all uploaded documents."""
    return {
        "documents": [
            {
                "doc_id": k,
                "filename": v["filename"],
                "total_pages": v["total_pages"],
                "flagged_count": sum(1 for c in v["clauses"] if c.get("flagged")),
                "risk_stats": v["risk_stats"]
            }
            for k, v in documents.items()
        ]
    }

def build_risk_stats(clauses: List[Dict]) -> Dict:
    """Build aggregate risk statistics."""
    category_counts = {}
    score_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    total_score = 0

    for clause in clauses:
        score = clause.get("risk_score", 1)
        score_dist[score] = score_dist.get(score, 0) + 1
        total_score += score
        cat = clause.get("category", "general")
        category_counts[cat] = category_counts.get(cat, 0) + 1

    flagged = [c for c in clauses if c.get("flagged")]
    avg_score = round(total_score / max(len(clauses), 1), 2)

    return {
        "total_clauses": len(clauses),
        "flagged_count": len(flagged),
        "average_risk_score": avg_score,
        "score_distribution": score_dist,
        "category_breakdown": category_counts,
        "overall_risk": "High" if avg_score >= 3.5 else "Medium" if avg_score >= 2 else "Low"
    }
