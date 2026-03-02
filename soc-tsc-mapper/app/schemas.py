"""
Schemas for request and response data structures for the matcher API.
Uses Pydantic for clarity and validation.
"""
from pydantic import BaseModel
from typing import List

class MatchRequest(BaseModel):
    control_text: str

class MatchResult(BaseModel):
    id: str
    section: str
    text: str
    distance: float

class MatchResponse(BaseModel):
    matches: List[MatchResult]
