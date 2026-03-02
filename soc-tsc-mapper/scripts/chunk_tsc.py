"""
Script to chunk the Trust Services Criteria (TSC) document into structured JSON.
Each chunk represents a single criterion, including its description and points of focus.
"""
from pathlib import Path
import re
import json

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_PATH = BASE_DIR / 'data' / 'raw' / 'tsc_full_document.txt'
OUT_PATH = BASE_DIR / 'data' / 'processed' / 'tsc_chunks.json'

# Regex patterns for section headers and criterion IDs
import os
import re
import json

RAW_PATH = os.path.join("data", "raw", "tsc_full_document.txt")
OUT_PATH = os.path.join("data", "processed", "tsc_chunks.json")

SECTION_PATTERN = re.compile(r"^[A-Z][A-Z ]+$")
CRITERION_PATTERN = re.compile(r"^[A-Z]+[0-9]+\.[0-9]+$")
PRINCIPLE_PATTERN = re.compile(r"^COSO Principle.*")

def chunk_tsc_document():
    with open(RAW_PATH, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]

    chunks = []
    section = None
    criterion = None
    principle = None
    bullet_counter = 0

    for line in lines:

        # Section header
        if SECTION_PATTERN.match(line):
            section = line
            continue

        # Criterion (supports CC, P, PI, A, C, etc.)
        if CRITERION_PATTERN.match(line):
            criterion = line
            bullet_counter = 0
            continue

        # Principle line
        if PRINCIPLE_PATTERN.match(line):
            principle = line
            continue

        # Bullet line
        if line.startswith("•"):
            if not (section and criterion):
                continue

            bullet_counter += 1
            bullet_text = line.lstrip("•").strip()

            enriched_text = (
                f"Section: {section}. "
                f"Criterion: {criterion}. "
                f"{principle + '. ' if principle else ''}"
                f"{bullet_text}"
            )

            chunk = {
                "id": f"{criterion}-{bullet_counter}",
                "section": section,
                "criterion": criterion,
                "principle": principle,
                "text": enriched_text
            }

            chunks.append(chunk)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=2)

    print(f"Created {len(chunks)} atomic chunks.")

if __name__ == "__main__":
    chunk_tsc_document()


def chunk_tsc_document():
    """
    Reads the raw TSC document and splits it into chunks by criterion.
    Each chunk contains: id, section, text.
    """
    with RAW_PATH.open('r', encoding='utf-8') as f:
        lines = [line.rstrip() for line in f]

    chunks = []
    current_section = None
    current_id = None
    parent_id = None
    in_points_of_focus = False
    bullet_pattern = re.compile(r'^•')

    for idx, line in enumerate(lines):
        if SECTION_HEADER_PATTERN.match(line):
            current_section = line.strip()
            continue
        if CRITERION_ID_PATTERN.match(line.strip()):
            current_id = line.split()[0]
            parent_id = current_id
            in_points_of_focus = False
            continue
        # Detect start of points of focus section
        if 'points of focus' in line.lower():
            in_points_of_focus = True
            continue
        # Only process bullets if in points of focus and have a valid criterion
        if in_points_of_focus and current_id and bullet_pattern.match(line.strip()):
            bullet_text = line.strip().lstrip('•').strip()
            # Collect multi-line bullet text
            j = idx + 1
            while j < len(lines) and not bullet_pattern.match(lines[j].strip()) and not CRITERION_ID_PATTERN.match(lines[j].strip()) and not SECTION_HEADER_PATTERN.match(lines[j]):
                next_line = lines[j].strip()
                # Stop at blank lines or headings
                if not next_line or SECTION_HEADER_PATTERN.match(next_line):
                    break
                bullet_text += ' ' + next_line
                j += 1
            enriched_text = f"Section: {current_section}. Criterion: {current_id}. {bullet_text}"
            chunk = {
                'id': current_id,
                'parent_id': parent_id,
                'section': current_section,
                'text': enriched_text
            }
            chunks.append(chunk)
            continue

    # Write to JSON
    with OUT_PATH.open('w', encoding='utf-8') as f:
        json.dump(chunks, f, indent=2)
    print(f"Chunked {len(chunks)} points of focus to {OUT_PATH}")


if __name__ == '__main__':
    chunk_tsc_document()
