"""
Matcher module for finding the most relevant TSC criteria for a given control description.
Loads FAISS index and metadata, embeds input, and returns top matches.
"""
from pathlib import Path
import json


import numpy as np
import faiss
from app.hybrid_retriever import HybridRetriever

import os
from openai import OpenAI

BASE_DIR = Path(__file__).resolve().parent.parent
INDEX_PATH = BASE_DIR / 'data' / 'processed' / 'tsc_faiss.index'
META_PATH = BASE_DIR / 'data' / 'processed' / 'tsc_metadata.json'


# Initialize OpenAI client once at module level
def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable not set.")
    return OpenAI(api_key=api_key)

openai_client = get_openai_client()

def get_embedding(text: str) -> np.ndarray:
    """
    Get OpenAI embedding for a single string, L2-normalized for cosine similarity.
    """
    try:
        response = openai_client.embeddings.create(
            input=[text],
            model="text-embedding-3-small"
        )
        vec = np.array(response.data[0].embedding, dtype=np.float32)
        norm = np.linalg.norm(vec)
        if norm < 1e-8:
            return vec
        return vec / norm
    except Exception as e:
        raise RuntimeError(f"OpenAI embedding error: {e}")



def load_index_and_metadata():
    if not INDEX_PATH.exists():
        raise FileNotFoundError(f"FAISS index file not found: {INDEX_PATH}")
    if not META_PATH.exists():
        raise FileNotFoundError(f"Metadata file not found: {META_PATH}")
    index = faiss.read_index(str(INDEX_PATH))
    with META_PATH.open('r', encoding='utf-8') as f:
        metadata = json.load(f)
    # Also load chunks from tsc_chunks.json for hybrid retrieval
    CHUNKS_PATH = BASE_DIR / 'data' / 'processed' / 'tsc_chunks.json'
    with CHUNKS_PATH.open('r', encoding='utf-8') as f:
        chunks = json.load(f)
    return index, metadata, chunks


def match_control(control_text: str, top_k: int = 10, alpha: float = 0.6):
    """
    Returns top_k most relevant TSC chunks using hybrid dense-sparse retrieval (RRF fusion).
    Optional alpha parameter controls dense/sparse weighting.
    """
    index, metadata, chunks = load_index_and_metadata()
    query_embedding = get_embedding(control_text)
    # Instantiate HybridRetriever (do not cache, to preserve statelessness)
    hybrid_retriever = HybridRetriever(chunks, index, alpha=alpha)
    hybrid_results = hybrid_retriever.retrieve(control_text, query_embedding, top_n=top_k)

    seen_ids = set()
    results = []
    for item in hybrid_results:
        chunk = item["chunk"]
        if chunk["id"] in seen_ids:
            continue
        seen_ids.add(chunk["id"])
        results.append({
            "id": chunk["id"],
            "section": chunk.get("section", ""),
            "text": chunk.get("text", ""),
            "score": float(item["score"])
        })

    # Sort descending by score (should already be sorted, but for safety)
    results = sorted(results, key=lambda x: x["score"], reverse=True)
    return results[:top_k]
