import os
import pickle
import numpy as np
from typing import List, Dict, Tuple
from pathlib import Path

# Use sentence-transformers for local embeddings (no API key needed)
try:
    from sentence_transformers import SentenceTransformer
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    USE_EMBEDDINGS = True
except Exception as e:
    print(f"Warning: sentence-transformers not available: {e}")
    USE_EMBEDDINGS = False

try:
    import faiss
    USE_FAISS = True
except:
    USE_FAISS = False

# In-memory store: doc_id -> {chunks, embeddings, index}
vector_stores: Dict[str, Dict] = {}

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk_words = words[i:i + chunk_size]
        chunk = " ".join(chunk_words)
        if len(chunk.strip()) > 20:
            chunks.append(chunk)
        i += chunk_size - overlap
    return chunks

def build_vector_store(doc_id: str, full_text: str) -> int:
    """Build FAISS index for a document. Returns number of chunks."""
    chunks = chunk_text(full_text)
    if not chunks:
        return 0

    if USE_EMBEDDINGS and USE_FAISS:
        embeddings = embedding_model.encode(chunks, show_progress_bar=False)
        embeddings = np.array(embeddings, dtype='float32')

        dimension = embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(embeddings)

        vector_stores[doc_id] = {
            "chunks": chunks,
            "index": index,
            "embeddings": embeddings
        }
    else:
        # Fallback: keyword-based search
        vector_stores[doc_id] = {
            "chunks": chunks,
            "index": None,
            "embeddings": None
        }

    return len(chunks)

def search_similar(doc_id: str, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
    """Search for relevant chunks given a query."""
    if doc_id not in vector_stores:
        return []

    store = vector_stores[doc_id]
    chunks = store["chunks"]

    if USE_EMBEDDINGS and USE_FAISS and store["index"] is not None:
        query_embedding = embedding_model.encode([query])
        query_embedding = np.array(query_embedding, dtype='float32')

        distances, indices = store["index"].search(query_embedding, min(top_k, len(chunks)))

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(chunks):
                results.append((chunks[idx], float(dist)))
        return results
    else:
        # Fallback: simple keyword search
        query_words = set(query.lower().split())
        scored = []
        for chunk in chunks:
            chunk_words = set(chunk.lower().split())
            score = len(query_words & chunk_words) / max(len(query_words), 1)
            scored.append((chunk, score))
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]

def get_top_chunks(doc_id: str, query: str, top_k: int = 5) -> List[str]:
    """Get top-k relevant chunks as strings."""
    results = search_similar(doc_id, query, top_k)
    return [chunk for chunk, _ in results]

def delete_store(doc_id: str):
    """Remove a document's vector store."""
    if doc_id in vector_stores:
        del vector_stores[doc_id]
