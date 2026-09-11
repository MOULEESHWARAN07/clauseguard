import fitz  # PyMuPDF
import spacy
import json
from pathlib import Path
from typing import List, Dict, Any
import re

# Load spaCy model (fallback to small if transformer not available)
try:
    nlp = spacy.load("en_core_web_sm")
except:
    nlp = None

def extract_pdf(file_path: str) -> Dict[str, Any]:
    """Extract text, clauses, and bounding boxes from a PDF."""
    doc = fitz.open(file_path)
    pages_data = []
    all_text = ""

    for page_num, page in enumerate(doc):
        page_text = page.get_text()
        all_text += page_text + "\n"
        blocks = page.get_text("dict")["blocks"]
        page_rect = page.rect

        sentences = []
        if nlp:
            doc_nlp = nlp(page_text)
            for sent in doc_nlp.sents:
                text = sent.text.strip()
                if len(text) > 30:
                    # Find approximate bbox for sentence
                    bbox = find_sentence_bbox(page, text)
                    sentences.append({
                        "text": text,
                        "bbox": bbox,
                        "page": page_num,
                        "entities": extract_entities(text)
                    })
        else:
            # Fallback: split by periods
            raw_sentences = [s.strip() for s in page_text.split('.') if len(s.strip()) > 30]
            for i, text in enumerate(raw_sentences):
                sentences.append({
                    "text": text + ".",
                    "bbox": None,
                    "page": page_num,
                    "entities": []
                })

        pages_data.append({
            "page_num": page_num,
            "width": page_rect.width,
            "height": page_rect.height,
            "text": page_text,
            "sentences": sentences
        })

    doc.close()

    return {
        "total_pages": len(pages_data),
        "full_text": all_text,
        "pages": pages_data,
        "clauses": extract_clauses(all_text)
    }

def find_sentence_bbox(page, sentence: str) -> List[float]:
    """Find bounding box of a sentence on a page."""
    try:
        # Search for first 50 chars of sentence
        search_text = sentence[:50].strip()
        areas = page.search_for(search_text)
        if areas:
            rect = areas[0]
            return [rect.x0, rect.y0, rect.x1, rect.y1]
    except:
        pass
    return None

def extract_entities(text: str) -> List[Dict]:
    """Extract named entities from text."""
    entities = []
    if not nlp:
        return entities
    try:
        doc = nlp(text)
        for ent in doc.ents:
            if ent.label_ in ["ORG", "PERSON", "DATE", "MONEY", "GPE", "LAW"]:
                entities.append({"text": ent.text, "label": ent.label_})
    except:
        pass
    return entities

def extract_clauses(full_text: str) -> List[Dict]:
    """Extract individual clauses from full document text."""
    clauses = []

    # Pattern to detect clause-like sentences
    risk_patterns = [
        r'(?i)(penalt|fine|liquidated damage)',
        r'(?i)(auto.renew|automatic renewal|evergreen)',
        r'(?i)(liabilit|indemnif)',
        r'(?i)(terminat)',
        r'(?i)(intellectual property|ip rights|copyright)',
        r'(?i)(jurisdiction|governing law|arbitration)',
        r'(?i)(confidential|non-disclosure|nda)',
        r'(?i)(payment|invoice|due date|overdue)',
        r'(?i)(warranty|guarantee|representation)',
        r'(?i)(force majeure|act of god)',
    ]

    sentences = []
    if nlp:
        doc = nlp(full_text[:100000])  # Limit for performance
        sentences = [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 40]
    else:
        sentences = [s.strip() + '.' for s in full_text.split('.') if len(s.strip()) > 40]

    for i, sentence in enumerate(sentences[:200]):  # Limit clauses
        matched_categories = []
        for pattern in risk_patterns:
            if re.search(pattern, sentence):
                category = pattern_to_category(pattern)
                if category not in matched_categories:
                    matched_categories.append(category)

        if matched_categories or len(sentence) > 80:
            clauses.append({
                "id": i,
                "text": sentence,
                "categories": matched_categories,
                "is_flagged": len(matched_categories) > 0
            })

    return clauses

def pattern_to_category(pattern: str) -> str:
    mapping = {
        "penalt": "penalty",
        "auto.renew": "auto_renewal",
        "liabilit": "liability_cap",
        "indemnif": "indemnity",
        "terminat": "termination",
        "intellectual property": "ip_ownership",
        "jurisdiction": "jurisdiction",
        "confidential": "confidentiality",
        "payment": "payment",
        "warranty": "warranty",
        "force majeure": "force_majeure",
    }
    for key, val in mapping.items():
        if key in pattern.lower():
            return val
    return "general"
