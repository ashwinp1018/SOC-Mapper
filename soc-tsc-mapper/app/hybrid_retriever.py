"""
HybridRetriever: Hybrid dense-sparse retrieval with Reciprocal Rank Fusion (RRF).

- Dense: FAISS (cosine similarity, IndexFlatIP)
- Sparse: BM25 (rank_bm25)
- RRF fusion: score = alpha * (1/(k + dense_rank)) + (1-alpha) * (1/(k + sparse_rank))

Dependencies: numpy, faiss, rank_bm25
"""
import numpy as np
from rank_bm25 import BM25Okapi


ALPHA_PRESETS = {
    "keyword_heavy": 0.4,
    "balanced": 0.6,
    "semantic_heavy": 0.7
}

FAMILY_KEYWORDS = {
    "CC1": ["governance", "board", "integrity", "ethical", "organizational structure", "oversight", "accountability", "coso"],
    "CC2": ["communication", "information", "external", "internal reporting", "disclosure", "notify", "reporting"],
    "CC3": ["risk", "fraud", "risk appetite", "risk assessment", "objectives", "change management risk"],
    "CC4": ["monitoring", "deficiency", "evaluation", "ongoing", "separate evaluation", "audit committee"],
    "CC5": ["control activities", "policies", "procedures", "technology general controls"],
    "CC6": ["access", "logical", "authentication", "authorization", "credential", "encryption", "provisioning", "deprovisioning"],
    "CC7": ["incident", "threat", "detection", "response", "anomaly", "malware", "breach", "vulnerability", "security event"],
    "CC8": ["change", "sdlc", "deployment", "release", "development", "production change"],
    "CC9": ["vendor", "third party", "subservice", "contract", "msa", "service commitment", "business disruption"],
    "PI":  ["processing integrity", "complete", "accurate", "timely", "authorized processing", "transaction"],
    "A":   ["availability", "uptime", "capacity", "recovery", "backup", "resilience", "rto", "rpo"],
    "C":   ["confidentiality", "classification", "disposal", "nda", "sensitive", "confidential information"],
    "P":   ["privacy", "personal information", "consent", "data subject", "collection"],
}


class HybridRetriever:

    def __init__(self, chunks, faiss_index, k=60, alpha=0.6):
        self.chunks = chunks
        self.faiss_index = faiss_index
        self.k = k
        self.alpha = alpha
        tokenized_corpus = [
            c.get("enriched_text", c.get("text", "")).lower().split()
            for c in self.chunks
        ]
        self.bm25 = BM25Okapi(tokenized_corpus)

    def compute_family_boost(self, query, criterion, boost_weight=0.003):
        query_lower = query.lower()
        for family, keywords in FAMILY_KEYWORDS.items():
            if not criterion.startswith(family):
                continue
            hits = sum(1 for kw in keywords if kw in query_lower)
            if hits > 0:
                return boost_weight * min(hits, 3)
        return 0.0

    def retrieve(self, query, query_embedding, top_n=10):
        query_vec = np.array(query_embedding).reshape(1, -1).astype("float32")
        _, dense_indices_raw = self.faiss_index.search(query_vec, len(self.chunks))
        dense_indices = dense_indices_raw[0]
        dense_ranks = {int(idx): rank for rank, idx in enumerate(dense_indices)}

        tokenized_query = query.lower().split()
        bm25_scores = self.bm25.get_scores(tokenized_query)
        sparse_indices = np.argsort(bm25_scores)[::-1]
        sparse_ranks = {int(idx): rank for rank, idx in enumerate(sparse_indices)}

        all_ids = set(dense_ranks.keys()) | set(sparse_ranks.keys())
        rrf_scores = {}
        for idx in all_ids:
            d_rank = dense_ranks.get(idx, len(self.chunks))
            s_rank = sparse_ranks.get(idx, len(self.chunks))
            rrf = self.alpha * (1 / (self.k + d_rank)) + (1 - self.alpha) * (1 / (self.k + s_rank))
            criterion = self.chunks[idx].get("criterion", "")
            boost = self.compute_family_boost(query, criterion)
            rrf_scores[idx] = rrf + boost

        top = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
        return [
            {
                "chunk": self.chunks[idx],
                "score": score,
                "dense_rank": dense_ranks.get(idx, -1),
                "sparse_rank": sparse_ranks.get(idx, -1)
            }
            for idx, score in top
        ]

    def score_breakdown(self, query, query_embedding, criterion):
        all_results = self.retrieve(query, query_embedding, top_n=len(self.chunks))
        filtered = [
            r for r in all_results
            if r["chunk"].get("criterion", "").startswith(criterion)
        ]
        return [
            {
                "chunk": r["chunk"],
                "dense_rank": r["dense_rank"],
                "sparse_rank": r["sparse_rank"],
                "score": r["score"]
            }
            for r in filtered
        ]