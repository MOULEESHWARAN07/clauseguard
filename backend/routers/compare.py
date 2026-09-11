from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import difflib
import tempfile
import os
import uuid

from services.pdf_service import extract_pdf
from services.ai_service import analyze_diff_impact

router = APIRouter()

@router.post("/")
async def compare_documents(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...)
):
    """Compare two PDF documents and return diff with impact analysis."""
    for f in [file1, file2]:
        if not f.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    tmp_paths = []
    try:
        # Save both files
        for f in [file1, file2]:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                content = await f.read()
                tmp.write(content)
                tmp_paths.append(tmp.name)

        # Extract both documents
        doc1 = extract_pdf(tmp_paths[0])
        doc2 = extract_pdf(tmp_paths[1])

        # Get sentences from both
        def get_sentences(doc_data):
            sentences = []
            for page in doc_data["pages"]:
                for sent in page.get("sentences", []):
                    sentences.append(sent["text"])
            # Fallback to clause texts
            if not sentences:
                sentences = [c["text"] for c in doc_data["clauses"]]
            return sentences

        sents1 = get_sentences(doc1)
        sents2 = get_sentences(doc2)

        # Compute diff
        matcher = difflib.SequenceMatcher(None, sents1, sents2)
        diff_results = []

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == "equal":
                for i in range(i1, i2):
                    diff_results.append({
                        "type": "equal",
                        "original": sents1[i],
                        "modified": sents1[i],
                        "impact": None
                    })
            elif tag == "replace":
                orig_block = " ".join(sents1[i1:i2])
                mod_block = " ".join(sents2[j1:j2])
                impact = await analyze_diff_impact(orig_block, mod_block)
                diff_results.append({
                    "type": "modified",
                    "original": orig_block,
                    "modified": mod_block,
                    "impact": impact
                })
            elif tag == "insert":
                added = " ".join(sents2[j1:j2])
                diff_results.append({
                    "type": "added",
                    "original": None,
                    "modified": added,
                    "impact": "New clause added to document."
                })
            elif tag == "delete":
                removed = " ".join(sents1[i1:i2])
                diff_results.append({
                    "type": "removed",
                    "original": removed,
                    "modified": None,
                    "impact": "Clause removed from document."
                })

        # Stats
        added = sum(1 for d in diff_results if d["type"] == "added")
        removed = sum(1 for d in diff_results if d["type"] == "removed")
        modified = sum(1 for d in diff_results if d["type"] == "modified")

        return {
            "file1": file1.filename,
            "file2": file2.filename,
            "stats": {
                "added": added,
                "removed": removed,
                "modified": modified,
                "unchanged": sum(1 for d in diff_results if d["type"] == "equal")
            },
            "diff": diff_results[:100]  # Limit output
        }

    finally:
        for path in tmp_paths:
            try:
                os.unlink(path)
            except:
                pass
