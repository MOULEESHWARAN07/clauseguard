import re
from typing import List, Tuple, Dict

# In-memory store: doc_id -> {chunks}
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
    """Build keyword index for a document."""
    chunks = chunk_text(full_text)
    if not chunks:
        return 0
    vector_stores[doc_id] = {"chunks": chunks}
    return len(chunks)

def keyword_score(query: str, chunk: str) -> float:
    """Score chunk relevance using keyword matching."""
    query_words = set(re.findall(r'\w+', query.lower()))
    chunk_words = set(re.findall(r'\w+', chunk.lower()))
    # Remove common stop words
    stop_words = {'the','a','an','is','are','was','were','be','been',
                  'being','have','has','had','do','does','did','will',
                  'would','could','should','may','might','shall','can',
                  'to','of','in','for','on','with','at','by','from',
                  'and','or','but','if','then','that','this','it','its'}
    query_words -= stop_words
    chunk_words -= stop_words
    if not query_words:
        return 0.0
    overlap = len(query_words & chunk_words)
    return overlap / len(query_words)

def get_top_chunks(doc_id: str, query: str, top_k: int = 5) -> List[str]:
    """Get top-k relevant chunks using keyword search."""
    if doc_id not in vector_stores:
        return []
    chunks = vector_stores[doc_id]["chunks"]
    scored = [(chunk, keyword_score(query, chunk)) for chunk in chunks]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [chunk for chunk, score in scored[:top_k] if score >= 0]

def delete_store(doc_id: str):
    """Remove a document's store."""
    if doc_id in vector_stores:
        del vector_stores[doc_id]