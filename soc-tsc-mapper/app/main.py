"""
Minimal FastAPI app exposing a /match-control endpoint.
"""
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import MatchRequest, MatchResponse
from app.matcher import match_control, openai_client
from dotenv import load_dotenv
import os
import pdfplumber
import docx
import io
import json

# Load environment variables from .env file
load_dotenv(override=True)

# In-memory extraction progress tracking
extraction_progress = {}

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

@app.post("/generate-narrative")
async def generate_narrative(request: dict):
    print(f"[NARRATIVE] Generating for control: {request.get('control_text', '')[:80]}...")
    print(f"[NARRATIVE] Criteria: {request.get('criteria', [])}")
    
    try:
        control_text = request.get("control_text", "").strip()
        criteria = request.get("criteria", [])
        
        if not control_text:
            raise HTTPException(status_code=400, detail="Control text cannot be empty")
        
        criteria_str = ", ".join(criteria) if criteria else "Not specified"
        
        system_prompt = """You are an EY senior auditor writing testing narratives 
for a SOC 2 Type II audit report.

TESTING PROCEDURES:
There are exactly 5 types of testing procedures. Use them as follows:

1. INSPECTION (most common, ~95% of tests):
   Format: "Inspected [document/system/record] to determine whether [control in past tense]."
   Example: "Inspected the user access review documentation to determine whether access reviews were performed on a quarterly basis."

2. INQUIRY:
   Format: "Inquired of [person/role] regarding [topic] to determine whether [control in past tense]."
   Example: "Inquired of the IT Manager regarding the patch management process to determine whether critical patches were applied within the defined timeframe."

3. OBSERVATION:
   Format: "Observed [process/activity] to determine whether [control in past tense]."
   Example: "Observed the change advisory board meeting to determine whether changes were reviewed and approved prior to implementation."

4. REPERFORMANCE:
   Format: "Re-performed [procedure/calculation] to determine whether [control in past tense]."
   Example: "Re-performed the user access review for a sample of terminated employees to determine whether access was revoked within 24 hours of termination."

5. RECALCULATION:
   Format: "Recalculated [metric/figure] to determine whether [control in past tense]."
   Example: "Recalculated the patch compliance rate to determine whether the percentage of patched systems met the defined threshold."

STRICT RULES:
- Every single sentence must end with "to determine whether [control in past tense]"
- NEVER use any phrase other than "to determine whether" — not "to verify", not "to confirm", not "to assess", not "to ensure"
- NEVER mention Trust Services Criteria codes (CC6.1, A1.2 etc.)
- NEVER use first person (no "we", "our", "I")
- NEVER use "the organization" more than once across all paragraphs
- NEVER use "Obtained and reviewed" — this is banned
- Use past tense for the control activity at the end of each sentence
- Default to INSPECTION for most tests
- Use INQUIRY when testing management's awareness or process knowledge
- Use OBSERVATION when testing a physical or process control
- Use REPERFORMANCE when testing a calculation or access control sample
- Use RECALCULATION when testing a metric or computed value

ORDER RULES:
- Read the control description carefully from top to bottom
- Identify every distinct procedure or activity mentioned in the control
  in the exact order they appear
- Write the testing paragraphs in the SAME ORDER as the procedures 
  appear in the control description
- The first thing mentioned in the control = first testing paragraph
- The second thing mentioned in the control = second testing paragraph
- The third thing mentioned in the control = third testing paragraph
- Never reorder, group, or reorganize the testing procedures
- Never test something in paragraph 2 that was mentioned first 
  in the control description

STRUCTURE:
- Write exactly 2 to 3 paragraphs
- Each paragraph = exactly 1 to 2 sentences
- Each paragraph tests ONE specific aspect of the control
- Start each paragraph on a new line with a blank line between paragraphs
- First paragraph: inspect the policy, procedure, or configuration
- Second paragraph: test operating effectiveness using "For a sample of..."
- Third paragraph (only if needed): test a specific technical or system control

OUTPUT:
- Output ONLY the narrative paragraphs
- No labels, no preamble, no bullet points, no headers
- No explanation of what you are doing"""

        user_prompt = f"""Write a SOC 2 audit testing narrative for the 
following control:

Control Description:
{control_text}

CRITICAL REQUIREMENT — ORDER:
Read the control description from start to finish.
Write your testing paragraphs in the EXACT SAME ORDER as the 
activities appear in the control.
If the control mentions (1) policy documentation, then (2) quarterly 
reviews, then (3) deprovisioning — your paragraphs must test them 
in that exact sequence: policy first, quarterly reviews second, 
deprovisioning third.
Do not reorder. Do not group. Follow the control sequence exactly.

Other requirements:
- Every sentence must end with "to determine whether" followed 
  by the control activity in past tense
- Default to Inspected for most paragraphs
- Use "For a sample of..." when testing operating effectiveness
- Do not mention any criteria codes
- Do not use "Obtained and reviewed"
- Write 2 to 3 paragraphs only
- Output only the paragraphs, nothing else"""

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=400,
            temperature=0.3
        )
        
        narrative = response.choices[0].message.content.strip()
        print(f"[NARRATIVE] Generated successfully: {narrative[:80]}...")
        
        return {
            "narrative": narrative,
            "criteria": criteria,
            "control_preview": control_text[:100]
        }
    
    except Exception as e:
        print(f"[NARRATIVE ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-section3")
async def upload_section3(file: UploadFile = File(...)):
    print(f"[UPLOAD] Received file: {file.filename}, type: {file.content_type}")
    
    try:
        contents = await file.read()
        text = ""
        
        if file.filename.endswith(".pdf"):
            with pdfplumber.open(io.BytesIO(contents)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            print(f"[UPLOAD] Extracted {len(text)} characters from PDF")
        
        elif file.filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(contents))
            for para in doc.paragraphs:
                if para.text.strip():
                    text += para.text + "\n"
            print(f"[UPLOAD] Extracted {len(text)} characters from DOCX")
        
        else:
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file type. Please upload PDF or DOCX."
            )
        
        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from document."
            )
        
        return {
            "filename": file.filename,
            "text": text,
            "character_count": len(text),
            "status": "extracted"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[UPLOAD ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/extraction-progress/{job_id}")
async def get_extraction_progress(job_id: str):
    progress = extraction_progress.get(job_id, {
        "current": 0, "total": 0, "status": "idle", "controls_found": 0
    })
    return progress

@app.post("/extract-controls")
async def extract_controls(request: dict):
    text = request.get("text", "").strip()
    job_id = request.get("job_id", "default")
    
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
    
    print(f"[EXTRACT] Processing {len(text)} characters of Section 3 text")
    
    CHUNK_SIZE = 10000
    OVERLAP = 500
    
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - OVERLAP
    
    print(f"[EXTRACT] Split into {len(chunks)} chunks")
    
    system_prompt = """You are an expert SOC 2 auditor reading a 
Section 3 System Description document.

The document contains controls marked with reference numbers in 
parentheses like (1.01), (1.02), (2.01), (3.01) etc.

EXTRACTION RULES:
- Find every reference number in format (X.XX) where X is a digit
- Extract the complete text surrounding that reference number 
  as the control description
- The control text is usually the full sentence or paragraph 
  that ends with or contains the reference number
- Include the full context — if a heading like "Quality Audit" 
  or "Performance Monitoring" appears before the control text, 
  include it as context in the description
- The control_number should be the reference number found 
  e.g. "1.01", "1.02", "2.01"
- Clean up the description — remove the (X.XX) number from 
  the description text itself
- Start each description with "The organization..." or rephrase 
  the extracted text to be a proper control statement
- If redacted text appears as black boxes or [REDACTED] replace 
  with "the organization" or "management"

For each control return:
1. control_number: the reference number as string e.g. "1.01"
2. control_description: the full control text, cleaned up, 
   starting with "The organization..." 
3. domain: one of: "Governance", "Access Control", 
   "Risk Management", "Change Management", "Incident Response", 
   "Availability", "Confidentiality", "Privacy", 
   "Processing Integrity", "Vendor Management", "Monitoring", "Other"

Return ONLY a valid JSON array. No preamble. No explanation.
If no numbered controls found return empty array: []"""

    all_controls = []
    seen_descriptions = set()
    counter = 1
    
    extraction_progress[job_id] = {
        "current": 0, "total": len(chunks),
        "status": "processing", "controls_found": 0
    }

    for i, chunk in enumerate(chunks):
        print(f"[EXTRACT] Processing chunk {i+1}/{len(chunks)}")
        
        try:
            user_prompt = f"""Extract all controls marked with reference 
numbers in format (X.XX) from this text:

{chunk}

For each (X.XX) number found, extract the surrounding text as 
the control description. Return only the JSON array."""

            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=4000,
                temperature=0.1
            )
            
            raw = response.choices[0].message.content.strip()
            
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()
            
            chunk_controls = json.loads(raw)
            print(f"[EXTRACT] Chunk {i+1} returned {len(chunk_controls)} controls")
            
            for control in chunk_controls:
                desc = control.get("control_description", "").strip()
                
                # Deduplicate using first 80 chars as fingerprint
                fingerprint = desc[:80].lower()
                if fingerprint and fingerprint not in seen_descriptions:
                    seen_descriptions.add(fingerprint)
                    control["control_number"] = str(counter)
                    all_controls.append(control)
                    counter += 1
        
            extraction_progress[job_id] = {
                "current": i + 1, "total": len(chunks),
                "status": "processing",
                "controls_found": len(all_controls)
            }

        except Exception as e:
            print(f"[EXTRACT] Chunk {i+1} failed: {str(e)}")
            extraction_progress[job_id] = {
                "current": i + 1, "total": len(chunks),
                "status": "processing",
                "controls_found": len(all_controls)
            }
            continue
    
    extraction_progress[job_id]["status"] = "complete"
    print(f"[EXTRACT] Total unique controls extracted: {len(all_controls)}")
    
    return {
        "controls": all_controls,
        "count": len(all_controls),
        "status": "success"
    }

# To run: uvicorn app.main:app --reload
