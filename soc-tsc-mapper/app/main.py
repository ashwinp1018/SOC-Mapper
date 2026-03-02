"""
Minimal FastAPI app exposing a /match-control endpoint.
"""
from fastapi import FastAPI
from app.schemas import MatchRequest, MatchResponse
from app.matcher import match_control

app = FastAPI(title="SOC TSC Matcher")

@app.post("/match-control", response_model=MatchResponse)
def match_control_endpoint(req: MatchRequest):
    matches = match_control(req.control_text, top_k=3)
    return MatchResponse(matches=matches)

# To run: uvicorn app.main:app --reload
