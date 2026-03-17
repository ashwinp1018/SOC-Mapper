"""
Minimal FastAPI app exposing a /match-control endpoint.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import MatchRequest, MatchResponse
from app.matcher import match_control

app = FastAPI(title="SOC TSC Matcher")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/health")
def health():
    print("[HEALTH] Health check called")
    return {"status": "ok"}

@app.post("/match-control", response_model=MatchResponse)
def match_control_endpoint(req: MatchRequest):
    matches = match_control(req.control_text, top_k=3)
    return MatchResponse(matches=matches)

@app.post("/match")
async def match(request: dict):
    print(f"[MATCH] Received control: {request.get('control', '')[:80]}...")
    print(f"[MATCH] Alpha value: {request.get('alpha', 0.6)}")
    try:
        control = request.get("control", "").strip()
        alpha = float(request.get("alpha", 0.6))
        
        if not control:
            print("[MATCH ERROR] Empty control received")
            raise HTTPException(status_code=400, detail="Control description cannot be empty")
        
        results = match_control(control, alpha=alpha, top_k=10)
        print(f"[MATCH] Got {len(results)} results from match_control()")
        print("[MATCH] First raw result keys:", results[0].keys() if results else "empty")

        seen_criteria = {}
        for r in results:
            # match_control returns dicts with keys: id, section, text, score
            criterion = r.get("id", "")
            base = criterion.split("-")[0] if "-" in criterion else criterion
            if base not in seen_criteria or r["score"] > seen_criteria[base]["score"]:
                r["criterion_clean"] = base
                seen_criteria[base] = r

        deduped = sorted(seen_criteria.values(), key=lambda x: x["score"], reverse=True)[:10]

        formatted = [
            {
                "rank": i + 1,
                "criterion": r["criterion_clean"],
                "section": r.get("section", "UNKNOWN").upper(),
                "score": round(r["score"], 4)
            }
            for i, r in enumerate(deduped)
        ]
        print(f"[MATCH] Returning {len(formatted)} formatted results")
        return {"control": control, "results": formatted}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[MATCH EXCEPTION] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# To run: uvicorn app.main:app --reload
