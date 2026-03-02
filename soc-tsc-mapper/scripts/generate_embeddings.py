# Main function to generate embeddings and build FAISS index
def main():
    # Load TSC chunks
    if not CHUNKS_PATH.exists():
        raise FileNotFoundError(f"TSC chunks file not found: {CHUNKS_PATH}")
    with CHUNKS_PATH.open('r', encoding='utf-8') as f:
        chunks = json.load(f)

    texts = [chunk['text'] for chunk in chunks]
    embeddings = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i+BATCH_SIZE]
        batch_emb = embed_texts(batch)
        embeddings.append(batch_emb)
    embeddings = np.vstack(embeddings)

    # Infer embedding dimension dynamically
    embed_dim = embeddings.shape[1]

    # Create FAISS index for cosine similarity (IndexFlatIP)
    # Cosine similarity is achieved by L2-normalizing vectors and using inner product index
    index = faiss.IndexFlatIP(embed_dim)
    index.add(embeddings)

    # Save index
    faiss.write_index(index, str(INDEX_PATH))

    # Save metadata (id, section, text)
    with META_PATH.open('w', encoding='utf-8') as f:
        json.dump([
            {'id': c['id'], 'section': c['section'], 'text': c['text']} for c in chunks
        ], f, indent=2)
    print(f"Saved FAISS index to {INDEX_PATH} and metadata to {META_PATH}")
"""

Script to generate OpenAI embeddings for TSC chunks and store them in a FAISS index using cosine similarity.

"""

from pathlib import Path
import json

import numpy as np
import faiss

import os
from openai import OpenAI

BASE_DIR = Path(__file__).resolve().parent.parent
CHUNKS_PATH = BASE_DIR / 'data' / 'processed' / 'tsc_chunks.json'
INDEX_PATH = BASE_DIR / 'data' / 'processed' / 'tsc_faiss.index'
META_PATH = BASE_DIR / 'data' / 'processed' / 'tsc_metadata.json'


BATCH_SIZE = 96  # OpenAI recommends <100 per batch for embeddings

# Initialize OpenAI client once at module level
def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable not set.")
    return OpenAI(api_key=api_key)

openai_client = get_openai_client()



def get_openai_api_key():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable not set.")
    return api_key


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
        # L2 normalize for cosine similarity
        norm = np.linalg.norm(vec)
        if norm < 1e-8:
            return vec
        return vec / norm
    except Exception as e:
        raise RuntimeError(f"OpenAI embedding error: {e}")

def embed_texts(texts, model="text-embedding-3-small"):
    """
    Batch embed texts using OpenAI, L2-normalized for cosine similarity.
    """
    try:
        response = openai_client.embeddings.create(
            input=texts,
            model=model
        )
        vectors = [np.array(e.embedding, dtype=np.float32) for e in response.data]
        arr = np.stack(vectors)
        # L2 normalize for cosine similarity
        norms = np.linalg.norm(arr, axis=1, keepdims=True)
        arr = arr / np.clip(norms, 1e-8, None)
        return arr
    except Exception as e:
        raise RuntimeError(f"OpenAI embedding error: {e}")






    # Load TSC chunks
    if not CHUNKS_PATH.exists():
        raise FileNotFoundError(f"TSC chunks file not found: {CHUNKS_PATH}")
    with CHUNKS_PATH.open('r', encoding='utf-8') as f:
        chunks = json.load(f)

    texts = [chunk['text'] for chunk in chunks]
    embeddings = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i+BATCH_SIZE]
        batch_emb = embed_texts(batch)
        embeddings.append(batch_emb)
    embeddings = np.vstack(embeddings)

    # Infer embedding dimension dynamically
    embed_dim = embeddings.shape[1]

    # Create FAISS index for cosine similarity (IndexFlatIP)
    # Cosine similarity is achieved by L2-normalizing vectors and using inner product index
    index = faiss.IndexFlatIP(embed_dim)
    index.add(embeddings)

    # Save index
    faiss.write_index(index, str(INDEX_PATH))

    # Save metadata (id, section, text)
    with META_PATH.open('w', encoding='utf-8') as f:
        json.dump([
            {'id': c['id'], 'section': c['section'], 'text': c['text']} for c in chunks
        ], f, indent=2)
    print(f"Saved FAISS index to {INDEX_PATH} and metadata to {META_PATH}")


if __name__ == '__main__':
    main()
