"""
Test script for the matcher. Hardcodes a sample control description and prints top matches.
"""
import sys
sys.path.insert(0, '../app')  # Allow import of matcher.py

from app.matcher import match_control, get_embedding
from app.hybrid_retriever import HybridRetriever, ALPHA_PRESETS
import json
import faiss
from pathlib import Path


# --- TEST QUERIES ---
queries = [
    "The organization collects personal information only for purposes disclosed in its privacy notice. Individuals are informed of their rights regarding access, correction, and deletion of their personal data. Consent is obtained prior to collection and use of sensitive personal information.",
]



def deduplicate_by_criterion(results):
    seen = {}
    for r in results:
        raw_id = r["chunk"].get("id", r["chunk"].get("criterion", ""))
        criterion = raw_id.split("-")[0] if "-" in raw_id else raw_id
        if criterion not in seen or r["score"] > seen[criterion]["score"]:
            r["criterion_clean"] = criterion
            seen[criterion] = r
    return sorted(seen.values(), key=lambda x: x["score"], reverse=True)[:10]

def test_hybrid_retrieval():
    BASE_DIR = Path(__file__).resolve().parent.parent
    INDEX_PATH = BASE_DIR / 'data' / 'processed' / 'tsc_faiss.index'
    CHUNKS_PATH = BASE_DIR / 'data' / 'processed' / 'tsc_chunks.json'
    index = faiss.read_index(str(INDEX_PATH))
    with open(CHUNKS_PATH, 'r', encoding='utf-8') as f:
        chunks = json.load(f)
    hybrid = HybridRetriever(chunks, index, alpha=ALPHA_PRESETS['balanced'])
    for query in queries:
        query_embedding = get_embedding(query)
        results = hybrid.retrieve(query, query_embedding, top_n=30)  # get more for deduplication
        deduped = deduplicate_by_criterion(results)
        print(f"CONTROL - {query}\n")
        for i, r in enumerate(deduped, 1):
            c = r['chunk']
            criterion = r.get('criterion_clean', c.get('criterion', ''))
            section = c.get('section', '').upper()
            score = r['score']
            print(f"{i}. {criterion} | {section} | {score:.4f}")
        print("")


if __name__ == '__main__':
    test_hybrid_retrieval()
