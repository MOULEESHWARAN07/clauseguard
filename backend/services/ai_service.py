import httpx
import json
import os
from typing import Dict, Any, List, AsyncGenerator
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
MODEL_NAME = "llama-3.1-8b-instant"


async def score_clause(clause_text: str) -> Dict[str, Any]:
    print(f"Scoring: {clause_text[:50]}")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{GROQ_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": MODEL_NAME,
                    "messages": [
                        {"role": "system", "content": "You are a legal risk analyzer. Return valid JSON only."},
                        {"role": "user", "content": f"Analyze this clause: {clause_text}. Return JSON with risk_score 1-5, category, explanation, flagged true/false"}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 200,
                    "response_format": {"type": "json_object"}
                }
            )
            if response.status_code == 200:
                result = json.loads(response.json()["choices"][0]["message"]["content"])
                return {
                    "risk_score": int(result.get("risk_score", 1)),
                    "category": result.get("category", "general"),
                    "explanation": result.get("explanation", "No risk detected."),
                    "flagged": bool(result.get("flagged", False))
                }
            print(f"Groq error: {response.status_code}")
            return default_score()
    except Exception as e:
        print(f"Exception: {e}")
        return default_score()


def default_score() -> Dict[str, Any]:
    return {"risk_score": 1, "category": "general", "explanation": "Could not analyze.", "flagged": False}


async def chat_with_document(question: str, context_chunks: List[str], history: List[Dict] = []) -> AsyncGenerator[str, None]:
    context = "\n\n".join([f"[Clause {i+1}]: {chunk}" for i, chunk in enumerate(context_chunks)])
    messages = [{"role": "system", "content": f"You are ClauseGuard. Answer based ONLY on:\n{context}"}]
    for msg in history[-4:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": question})
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", f"{GROQ_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={"model": MODEL_NAME, "messages": messages, "temperature": 0.3, "max_tokens": 500, "stream": True}
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            token = json.loads(data_str)["choices"][0]["delta"].get("content", "")
                            if token:
                                yield token
                        except Exception:
                            continue
    except Exception as e:
        yield f"Error: {str(e)}"


async def analyze_diff_impact(original: str, modified: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{GROQ_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={"model": MODEL_NAME, "messages": [
                    {"role": "system", "content": "Legal analyst. Be concise."},
                    {"role": "user", "content": f"Business impact in 2 sentences.\nOriginal: {original}\nModified: {modified}"}
                ], "temperature": 0.1, "max_tokens": 150}
            )
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Diff error: {e}")
    return "Impact analysis unavailable."


async def generate_summary(full_text: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{GROQ_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={"model": MODEL_NAME, "messages": [
                    {"role": "system", "content": "Legal document summarizer."},
                    {"role": "user", "content": f"Summarize in 3 sentences:\n{full_text[:3000]}"}
                ], "temperature": 0.1, "max_tokens": 200}
            )
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Summary error: {e}")
    return "Summary unavailable."
