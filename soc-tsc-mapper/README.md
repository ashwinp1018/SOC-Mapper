# SOC TSC Mapper

A beginner-friendly Python tool for mapping SOC Trust Services Criteria (TSC) to control descriptions using semantic search.

## What does this project do?
- **Chunks** the TSC document into individual criteria
- **Generates embeddings** (random for now) for each chunk
- **Stores** embeddings in a FAISS index for fast similarity search
- **Matches** a control description to the most relevant TSC criteria
- **Provides** a minimal API for programmatic access

## Project Structure
```
soc-tsc-mapper/
│
├── data/
│   ├── raw/
│   │   └── tsc_full_document.txt         # Place the full TSC text here
│   └── processed/
│       ├── tsc_chunks.json               # Output: Chunks of criteria
│       ├── tsc_metadata.json             # Output: Metadata for each chunk
│       └── tsc_faiss.index               # Output: FAISS index
│
├── scripts/
│   ├── chunk_tsc.py                      # Script: Chunk the TSC document
│   ├── generate_embeddings.py            # Script: Generate embeddings and FAISS index
│   └── test_faiss_search.py              # Script: Test matching with a sample control
│
├── app/
│   ├── main.py                           # FastAPI app
│   ├── matcher.py                        # Matching logic
│   └── schemas.py                        # API schemas
│
├── requirements.txt                      # Python dependencies
└── README.md                             # This file
```

## How to run (step-by-step)

1. **Prepare the TSC document**
   - Place your full Trust Services Criteria text in `data/raw/tsc_full_document.txt`.

2. **Chunk the TSC document**
   ```bash
   cd scripts
   python chunk_tsc.py
   ```
   - Outputs `data/processed/tsc_chunks.json`

3. **Generate embeddings and FAISS index**
   ```bash
   python generate_embeddings.py
   ```
   - Outputs `data/processed/tsc_faiss.index` and `tsc_metadata.json`

4. **Test the matcher**
   ```bash
   python test_faiss_search.py
   ```
   - Prints top matches for a sample control description

5. **Run the API**
   ```bash
   uvicorn app.main:app --reload
   ```
   - Visit http://127.0.0.1:8000/docs for the interactive API

## How does FAISS fit in?
- FAISS is a fast similarity search library.
- We use it to store and search embeddings for each TSC criterion.
- When you provide a control description, we embed it and use FAISS to find the closest criteria.

## Note on Embeddings
- **Embeddings are random vectors for now.**
- No AI or LLM calls are made yet.
- You can later replace the embedding function with a real model.

## Simplicity First
- The code is heavily commented for clarity.
- No prior Python or AI experience is assumed.
- Each script does one thing and is easy to follow.
