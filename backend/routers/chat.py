from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import json

from services.ai_service import chat_with_document
from services.rag_service import get_top_chunks
from routers.documents import documents

router = APIRouter()

# In-memory chat history per document
chat_histories: Dict[str, List[Dict]] = {}

class ChatRequest(BaseModel):
    doc_id: str
    message: str
    history: Optional[List[Dict]] = []

@router.post("/")
async def chat(request: ChatRequest):
    """Chat with a document using RAG + streaming."""
    if request.doc_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Get relevant chunks via vector search
    top_chunks = get_top_chunks(request.doc_id, request.message, top_k=5)

    if not top_chunks:
        # Fallback to first few clauses
        clauses = documents[request.doc_id]["clauses"]
        top_chunks = [c["text"] for c in clauses[:5]]

    # Update history
    if request.doc_id not in chat_histories:
        chat_histories[request.doc_id] = []

    chat_histories[request.doc_id].append({
        "role": "user",
        "content": request.message
    })

    async def generate():
        full_response = ""
        # Send source chunks first
        sources = top_chunks[:3]
        source_data = json.dumps({"type": "sources", "chunks": sources})
        yield f"data: {source_data}\n\n"

        # Stream AI response
        async for token in chat_with_document(
            request.message,
            top_chunks,
            request.history
        ):
            full_response += token
            token_data = json.dumps({"type": "token", "content": token})
            yield f"data: {token_data}\n\n"

        # Save assistant response to history
        chat_histories[request.doc_id].append({
            "role": "assistant",
            "content": full_response
        })

        done_data = json.dumps({"type": "done"})
        yield f"data: {done_data}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/history/{doc_id}")
async def get_history(doc_id: str):
    """Get chat history for a document."""
    return {"history": chat_histories.get(doc_id, [])}

@router.delete("/history/{doc_id}")
async def clear_history(doc_id: str):
    """Clear chat history for a document."""
    if doc_id in chat_histories:
        del chat_histories[doc_id]
    return {"message": "History cleared."}
