import httpx
import json
import re
from typing import Dict, Any, List, AsyncGenerator

OLLAMA_BASE_URL = "http://localhost:11434"
MODEL_NAME = "llama3.2"

async def score_clause(clause_text: str) -> Dict[str, Any]:
    """Score a single clause for risk using Ollama."""
    prompt = f"""You are a legal contract risk analyzer. Analyze this contract clause and return ONLY valid JSON, nothing else.

Clause: "{clause_text}"

Return this exact JSON structure:
{{
  "risk_score": <integer 1-5>,
  "category": "<one of: penalty, auto_renewal, liability_cap, indemnity, termination, ip_ownership, jurisdiction, confidentiality, payment, warranty, force_majeure, general>",
  "explanation": "<one sentence explanation of the risk>",
  "flagged": <true if risk_score >= 3, else false>
}}

Risk score guide: 1=no risk, 2=low, 3=moderate, 4=high, 5=critical"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": MODEL_NAME,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                }
            )
            if response.status_code == 200:
                data = response.json()
                result_text = data.get("response", "{}")
                try:
                    result = json.loads(result_text)
                    return {
                        "risk_score": int(result.get("risk_score", 1)),
                        "category": result.get("category", "general"),
                        "explanation": result.get("explanation", "No significant risk detected."),
                        "flagged": bool(result.get("flagged", False))
                    }
                except:
                    return default_score()
    except Exception as e:
        print(f"Ollama error: {e}")
        return default_score()

def default_score() -> Dict[str, Any]:
    return {
        "risk_score": 1,
        "category": "general",
        "explanation": "Could not analyze clause automatically.",
        "flagged": False
    }

async def chat_with_document(question: str, context_chunks: List[str], history: List[Dict] = []) -> AsyncGenerator[str, None]:
    """Stream chat response about a document using retrieved context."""
    context = "\n\n".join([f"[Clause {i+1}]: {chunk}" for i, chunk in enumerate(context_chunks)])

    history_text = ""
    for msg in history[-4:]:  # Last 4 messages for context
        role = "User" if msg["role"] == "user" else "Assistant"
        history_text += f"{role}: {msg['content']}\n"

    prompt = f"""You are ClauseGuard, an expert contract analyst AI. Answer questions about the document based ONLY on the provided clauses.

Document Clauses:
{context}

{f"Conversation history:{history_text}" if history_text else ""}

User question: {question}

Give a clear, helpful answer. If the answer is not in the document, say so. Be concise."""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": MODEL_NAME,
                    "prompt": prompt,
                    "stream": True
                }
            ) as response:
                async for line in response.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            token = data.get("response", "")
                            if token:
                                yield token
                            if data.get("done"):
                                break
                        except:
                            continue
    except Exception as e:
        yield f"Error connecting to Ollama: {str(e)}. Make sure Ollama is running with 'ollama serve'."

async def analyze_diff_impact(original: str, modified: str) -> str:
    """Analyze business impact of a changed clause."""
    prompt = f"""Compare these two contract clause versions and explain the business impact in 2 sentences.

Original: "{original}"
Modified: "{modified}"

Return only the impact explanation, no preamble."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": MODEL_NAME,
                    "prompt": prompt,
                    "stream": False
                }
            )
            if response.status_code == 200:
                return response.json().get("response", "Impact could not be determined.")
    except:
        pass
    return "Impact analysis unavailable — ensure Ollama is running."

async def generate_summary(full_text: str) -> str:
    """Generate a one-paragraph document summary."""
    prompt = f"""Summarize this contract in 3 sentences. Focus on: parties involved, main purpose, key obligations.

Contract (first 3000 chars):
{full_text[:3000]}

Return only the summary."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": MODEL_NAME,
                    "prompt": prompt,
                    "stream": False
                }
            )
            if response.status_code == 200:
                return response.json().get("response", "")
    except:
        pass
    return "Summary unavailable."
