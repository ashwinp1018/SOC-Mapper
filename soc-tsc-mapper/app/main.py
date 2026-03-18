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
        criterion_bullets = {}

        for r in results:
            # match_control returns dicts with keys: id, section, text, score
            criterion = r.get("id", "")
            base = criterion.split("-")[0] if "-" in criterion else criterion
            
            if base not in criterion_bullets:
                criterion_bullets[base] = []
            
            bullet_text = r.get("text", "")
            if bullet_text and bullet_text not in criterion_bullets[base] and len(criterion_bullets[base]) < 3:
                criterion_bullets[base].append(bullet_text)

            if base not in seen_criteria or r["score"] > seen_criteria[base]["score"]:
                r["criterion_clean"] = base
                seen_criteria[base] = r

        deduped = sorted(seen_criteria.values(), key=lambda x: x["score"], reverse=True)[:10]

        formatted = [
            {
                "rank": i + 1,
                "criterion": r["criterion_clean"],
                "section": r.get("section", "UNKNOWN").upper(),
                "score": round(r["score"], 4),
                "bullets": criterion_bullets.get(r["criterion_clean"], [])
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

@app.post("/match/bulk")
async def match_bulk(request: dict):
    print(f"[BULK] Received bulk request")
    try:
        controls = request.get("controls", [])
        alpha = float(request.get("alpha", 0.6))
        top_k = int(request.get("top_k", 3))

        if not controls:
            raise HTTPException(status_code=400, detail="Controls list cannot be empty")

        results_out = []
        
        for i, control in enumerate(controls):
            control = control.strip()
            if not control:
                continue
                
            print(f"[BULK] Processing control {i+1}/{len(controls)}: {control[:60]}...")
            
            matches = match_control(control, alpha=alpha, top_k=20) 
            
            seen_criteria = {}
            criterion_bullets = {}

            for r in matches:
                criterion = r.get("id", "")
                base = criterion.split("-")[0] if "-" in criterion else criterion
                
                if base not in criterion_bullets:
                    criterion_bullets[base] = []
                
                bullet_text = r.get("text", "")
                if bullet_text and bullet_text not in criterion_bullets[base] and len(criterion_bullets[base]) < 3:
                    criterion_bullets[base].append(bullet_text)

                if base not in seen_criteria or r["score"] > seen_criteria[base]["score"]:
                    r["criterion_clean"] = base
                    seen_criteria[base] = r

            deduped = sorted(seen_criteria.values(), key=lambda x: x["score"], reverse=True)[:top_k]

            formatted = [
                {
                    "rank": j + 1,
                    "criterion": r["criterion_clean"],
                    "section": r.get("section", "UNKNOWN").upper(),
                    "score": round(r["score"], 4),
                    "bullets": criterion_bullets.get(r["criterion_clean"], [])
                }
                for j, r in enumerate(deduped)
            ]
            
            results_out.append({
                "control_number": i + 1,
                "control_text": control,
                "matches": formatted
            })
            
        print(f"[BULK] Returning {len(results_out)} bulk results")
        return {"results": results_out}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[BULK EXCEPTION] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# To run: uvicorn app.main:app --reload
