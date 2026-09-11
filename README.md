# 🛡️ ClauseGuard — Document Intelligence & Risk Analyzer

AI-powered contract risk analyzer. Runs 100% locally using Ollama. No API keys, no cost, no data sent externally.

## Features
- 📄 PDF upload + clause extraction
- ⚠️ AI risk scoring per clause (1-5 scale)
- 🔍 PDF viewer with color-coded risk highlights
- 💬 Chat with your document (RAG pipeline)
- 📊 Risk analytics dashboard
- 🔄 Document comparison with impact analysis

---

## ✅ Prerequisites

Install these first:
1. **Python 3.10+** → https://python.org
2. **Node.js 18+** → https://nodejs.org
3. **Ollama** → https://ollama.com/download/windows

---

## 🚀 Setup (One Time)

### Step 1 — Start Ollama + pull model
Open PowerShell:
```
ollama pull llama3.2
ollama serve
```
Keep this window open.

### Step 2 — Setup Backend
Open a NEW PowerShell window in the `backend` folder:
```
cd clauseguard\backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn python-multipart PyMuPDF spacy sentence-transformers faiss-cpu httpx python-dotenv pydantic
python -m spacy download en_core_web_sm
```

### Step 3 — Setup Frontend
Open a NEW PowerShell window in the `frontend` folder:
```
cd clauseguard\frontend
npm install
```

---

## ▶️ Running the App

Every time you want to use ClauseGuard, open 3 PowerShell windows:

**Window 1 — Ollama:**
```
ollama serve
```

**Window 2 — Backend:**
```
cd clauseguard\backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**Window 3 — Frontend:**
```
cd clauseguard\frontend
npm run dev
```

Then open **http://localhost:5173** in your browser. ✅

---

## 📁 Project Structure

```
clauseguard/
├── backend/
│   ├── main.py                  # FastAPI app
│   ├── routers/
│   │   ├── documents.py         # Upload, parse, score
│   │   ├── chat.py              # Streaming RAG chat
│   │   └── compare.py           # Document diff
│   └── services/
│       ├── pdf_service.py       # PyMuPDF extraction
│       ├── ai_service.py        # Ollama LLM calls
│       └── rag_service.py       # FAISS vector search
└── frontend/
    └── src/
        ├── pages/
        │   ├── DashboardPage.jsx
        │   ├── AnalyzePage.jsx  # Main PDF analysis
        │   └── ComparePage.jsx  # Document diff view
        ├── components/
        │   ├── ClausesPanel.jsx
        │   ├── ChatPanel.jsx
        │   ├── RiskDashboard.jsx
        │   ├── UploadZone.jsx
        │   └── UI.jsx
        └── services/api.js
```

---

## 🧑‍💻 Resume Description

> Built **ClauseGuard**, a full-stack AI document risk analyzer using RAG (FAISS + sentence-transformers) and local LLM (Ollama/LLaMA) to extract and score contract clauses. Features include PDF highlight overlay, streaming document Q&A, and version comparison with impact analysis. Stack: FastAPI · React · PyMuPDF · spaCy · LangChain.

---

## 🛠 Troubleshooting

| Problem | Fix |
|---|---|
| Backend 500 error | Make sure `ollama serve` is running |
| PDF not loading | Check browser console, try a smaller PDF first |
| Slow analysis | Normal on first run — model loads into memory |
| spaCy error | Run: `python -m spacy download en_core_web_sm` |
| Port conflict | Change `--port 8000` to `--port 8001` and update vite.config.js |
