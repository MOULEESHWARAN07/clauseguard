from pypdf import PdfReader
import re
from typing import List, Dict, Any

def extract_pdf(file_path: str) -> Dict[str, Any]:
    reader = PdfReader(file_path)
    pages_data = []
    all_text = ""

    for page_num, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        all_text += page_text + "\n"
        sentences = simple_sentence_split(page_text)
        page_sentences = []
        for sent in sentences:
            if len(sent.strip()) > 30:
                page_sentences.append({
                    "text": sent.strip(),
                    "bbox": None,
                    "page": page_num,
                    "entities": extract_simple_entities(sent)
                })
        pages_data.append({
            "page_num": page_num,
            "width": 595,
            "height": 842,
            "text": page_text,
            "sentences": page_sentences
        })

    return {
        "total_pages": len(pages_data),
        "full_text": all_text,
        "pages": pages_data,
        "clauses": extract_clauses(all_text)
    }

def simple_sentence_split(text: str) -> List[str]:
    sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9])', text)
    return [s.strip() for s in sentences if len(s.strip()) > 30]

def extract_simple_entities(text: str) -> List[Dict]:
    entities = []
    money_pattern = r'(INR|USD|Rs\.?|₹)\s*[\d,]+(?:\.\d+)?'
    date_pattern = r'\b\d{1,2}[\s/.-]\w+[\s/.-]\d{2,4}\b'
    for m in re.finditer(money_pattern, text, re.IGNORECASE):
        entities.append({"text": m.group(), "label": "MONEY"})
    for m in re.finditer(date_pattern, text, re.IGNORECASE):
        entities.append({"text": m.group(), "label": "DATE"})
    return entities

def extract_clauses(full_text: str) -> List[Dict]:
    risk_patterns = [
        (r'(?i)(penalt|fine|liquidated damage)', 'penalty'),
        (r'(?i)(auto.renew|automatic renewal)', 'auto_renewal'),
        (r'(?i)(liabilit)', 'liability_cap'),
        (r'(?i)(indemnif)', 'indemnity'),
        (r'(?i)(terminat)', 'termination'),
        (r'(?i)(intellectual property|ip rights)', 'ip_ownership'),
        (r'(?i)(jurisdiction|governing law)', 'jurisdiction'),
        (r'(?i)(confidential|non-disclosure)', 'confidentiality'),
        (r'(?i)(payment|invoice|due date)', 'payment'),
        (r'(?i)(warranty|guarantee)', 'warranty'),
        (r'(?i)(force majeure)', 'force_majeure'),
    ]

    sentences = simple_sentence_split(full_text)
    clauses = []

    for i, sentence in enumerate(sentences[:200]):
        if len(sentence.strip()) < 40:
            continue
        matched_categories = []
        for pattern, category in risk_patterns:
            if re.search(pattern, sentence):
                if category not in matched_categories:
                    matched_categories.append(category)
        if matched_categories or len(sentence) > 80:
            clauses.append({
                "id": i,
                "text": sentence.strip(),
                "categories": matched_categories,
                "is_flagged": len(matched_categories) > 0
            })

    return clauses