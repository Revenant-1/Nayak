import json
import hashlib
from pathlib import Path

import requests
from pypdf import PdfReader
from tqdm import tqdm


# =====================================================
# CONFIGURATION
# =====================================================

KB_DIR = Path("src/app/vector_db/Data/knowledge_base")
OUTPUT_FILE = Path("qwen_rag_finetune.jsonl")

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL = "qwen3.5:9b"

CHUNK_SIZE = 1500
CHUNK_OVERLAP = 200
MAX_CHUNKS_PER_PDF = 5


# =====================================================
# NAYAK SYSTEM PROMPT
# =====================================================

SYSTEM_PROMPT = """You are "Nayak", an authoritative and precise AI legal assistant specializing in Indian Law, with focus on government schemes, cooperation acts, and agricultural policies.

Rules:
- Grounding: Rely strictly on the provided context.
- Never invent facts, procedures, eligibility criteria, dates, amounts, or URLs.
- Citations: Always cite the exact source tag provided in the context.
- If the context does not contain enough information to answer, say that the provided document does not specify the answer.
- Keep answers concise and useful.
- End every answer with exactly:
Disclaimer: This is for informational purposes and does not constitute formal legal counsel.
"""


# =====================================================
# GENERATION PROMPT
# =====================================================

GENERATION_PROMPT = """You are creating high-quality training data for an AI assistant named "Nayak".

You will receive an excerpt from an official government document.

Generate exactly 2 realistic user questions and grounded answers based ONLY on the excerpt.

SOURCE:
{source_name}

EXCERPT:
{text_chunk}

STRICT REQUIREMENTS:

1. Questions should be realistic questions asked by:
   - farmers
   - citizens
   - cooperative society representatives
   - government officers

2. Answers must use ONLY information explicitly supported by the excerpt.

3. Do NOT add outside knowledge.

4. Do NOT invent:
   - websites
   - phone numbers
   - procedures
   - eligibility conditions
   - dates
   - monetary amounts
   - legal interpretations

5. Each answer should contain 2-4 concise bullet points where appropriate.

6. Each answer MUST contain this exact citation:
[Doc 1 | Source: {source_name}]

7. Each answer MUST end with this exact disclaimer:
Disclaimer: This is for informational purposes and does not constitute formal legal counsel.

8. Return ONLY valid JSON.

9. The JSON must have exactly this structure:

[
  {{
    "question": "Question 1",
    "answer": "Answer 1"
  }},
  {{
    "question": "Question 2",
    "answer": "Answer 2"
  }}
]
"""


# =====================================================
# PDF EXTRACTION
# =====================================================

def extract_pdf_chunks(
    pdf_path: Path,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
) -> list[str]:

    reader = PdfReader(str(pdf_path))

    full_text = ""

    for page in reader.pages:
        try:
            text = page.extract_text()

            if text:
                full_text += text + "\n"

        except Exception as e:
            print(f"\n⚠️ Could not extract a page from {pdf_path.name}: {e}")

    chunks = []

    start = 0

    while start < len(full_text):

        end = start + chunk_size

        chunk = full_text[start:end].strip()

        if len(chunk) > 300:
            chunks.append(chunk)

        start += chunk_size - overlap

    return chunks


# =====================================================
# OLLAMA GENERATION
# =====================================================

def generate_pairs_from_chunk(
    chunk: str,
    source_name: str,
) -> list[dict]:

    prompt = GENERATION_PROMPT.format(
        source_name=source_name,
        text_chunk=chunk,
    )

    payload = {
        "model": MODEL,
        "prompt": prompt,
        "system": SYSTEM_PROMPT,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.2,
        },
    }

    try:

        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=600,
        )

        response.raise_for_status()

        result = response.json()

        response_text = result.get("response", "").strip()

        if not response_text:
            print(f"\n⚠️ Empty response from Qwen for {source_name}")
            return []

        data = json.loads(response_text)

        # Ollama may occasionally return an object instead of a list.
        if isinstance(data, dict):

            if "questions" in data:
                data = data["questions"]

            elif "data" in data:
                data = data["data"]

        if not isinstance(data, list):
            print(f"\n⚠️ Unexpected JSON format from Qwen:")
            print(data)
            return []

        return data

    except requests.exceptions.ConnectionError:

        print(
            "\n❌ Cannot connect to Ollama."
            "\nMake sure Ollama is running."
        )

        return []

    except requests.exceptions.Timeout:

        print(
            f"\n⏱️ Qwen timed out while processing {source_name}"
        )

        return []

    except json.JSONDecodeError as e:

        print(
            f"\n❌ Qwen returned invalid JSON for {source_name}: {e}"
        )

        return []

    except Exception as e:

        print(
            f"\n❌ Error generating for {source_name}: {e}"
        )

        return []


# =====================================================
# CHECK OLLAMA
# =====================================================

def check_ollama():

    try:

        response = requests.get(
            "http://127.0.0.1:11434/api/tags",
            timeout=10,
        )

        response.raise_for_status()

        models = response.json().get("models", [])

        available_models = [
            model.get("name")
            for model in models
        ]

        if MODEL not in available_models:

            print(f"\n❌ Model '{MODEL}' was not found.")

            print("\nAvailable models:")

            for model in available_models:
                print(f"  - {model}")

            return False

        print(f"✅ Ollama is running")
        print(f"✅ Model available: {MODEL}")

        return True

    except Exception as e:

        print(f"\n❌ Ollama is not running: {e}")

        print("\nStart Ollama with:")
        print("ollama serve")

        return False


# =====================================================
# CHUNK ID
# =====================================================

def get_chunk_id(source_name: str, chunk: str) -> str:

    raw = f"{source_name}\n{chunk}"

    return hashlib.sha256(
        raw.encode("utf-8")
    ).hexdigest()


# =====================================================
# LOAD PROCESSED CHUNKS
# =====================================================

def load_processed_chunks():

    processed = set()

    if not OUTPUT_FILE.exists():
        return processed

    print(f"\n📂 Existing dataset found: {OUTPUT_FILE}")

    try:

        with open(
            OUTPUT_FILE,
            "r",
            encoding="utf-8",
        ) as f:

            for line in f:

                try:

                    record = json.loads(line)

                    user_content = record["messages"][1]["content"]

                    # Extract source
                    source_start = "[Doc 1 | Source: "

                    if source_start not in user_content:
                        continue

                    source_name = user_content.split(
                        source_start,
                        1,
                    )[1].split(
                        "]",
                        1,
                    )[0]

                    context_start = f"[Doc 1 | Source: {source_name}]\n"

                    if context_start not in user_content:
                        continue

                    chunk = user_content.split(
                        context_start,
                        1,
                    )[1].split(
                        "\n</context>",
                        1,
                    )[0]

                    processed.add(
                        get_chunk_id(
                            source_name,
                            chunk,
                        )
                    )

                except Exception:
                    continue

    except Exception as e:

        print(f"⚠️ Could not read existing dataset: {e}")

    print(
        f"✅ Found {len(processed)} previously processed chunks."
    )

    return processed


# =====================================================
# MAIN
# =====================================================

def main():

    print("=" * 60)
    print("NAYAK — LOCAL QWEN DATASET GENERATOR")
    print("=" * 60)

    print(f"\nModel: {MODEL}")
    print(f"Knowledge base: {KB_DIR}")
    print(f"Output: {OUTPUT_FILE}")

    # -------------------------------------------------
    # Check Ollama
    # -------------------------------------------------

    if not check_ollama():
        return

    # -------------------------------------------------
    # Find PDFs
    # -------------------------------------------------

    pdf_files = list(
        KB_DIR.rglob("*.pdf")
    )

    print(
        f"\n📚 Found {len(pdf_files)} PDFs."
    )

    if not pdf_files:

        print(
            f"\n❌ No PDFs found in {KB_DIR}"
        )

        return

    # -------------------------------------------------
    # Existing progress
    # -------------------------------------------------

    processed_chunks = load_processed_chunks()

    # -------------------------------------------------
    # Generate
    # -------------------------------------------------

    total_generated = 0
    total_skipped = 0

    with open(
        OUTPUT_FILE,
        "a",
        encoding="utf-8",
    ) as f_out:

        for pdf_path in tqdm(
            pdf_files,
            desc="Processing PDFs",
        ):

            print(
                f"\n\n📄 {pdf_path.name}"
            )

            chunks = extract_pdf_chunks(
                pdf_path
            )

            chunks = chunks[
                :MAX_CHUNKS_PER_PDF
            ]

            print(
                f"   Using {len(chunks)} chunks"
            )

            for chunk_number, chunk in enumerate(
                chunks,
                start=1,
            ):

                chunk_id = get_chunk_id(
                    pdf_path.name,
                    chunk,
                )

                # -----------------------------------------
                # Skip already processed chunk
                # -----------------------------------------

                if chunk_id in processed_chunks:

                    print(
                        f"   ⏭️ Chunk {chunk_number} already processed"
                    )

                    total_skipped += 1

                    continue

                # -----------------------------------------
                # Generate
                # -----------------------------------------

                print(
                    f"   🤖 Qwen generating chunk "
                    f"{chunk_number}/{len(chunks)}..."
                )

                pairs = generate_pairs_from_chunk(
                    chunk,
                    pdf_path.name,
                )

                if not pairs:

                    print(
                        f"   ⚠️ No data generated for chunk "
                        f"{chunk_number}"
                    )

                    continue

                # -----------------------------------------
                # Save immediately
                # -----------------------------------------

                for item in pairs:

                    if (
                        not isinstance(item, dict)
                        or "question" not in item
                        or "answer" not in item
                    ):
                        print(
                            "   ⚠️ Invalid Qwen item skipped"
                        )
                        continue

                    user_content = (
                        f"<context>\n"
                        f"[Doc 1 | Source: {pdf_path.name}]\n"
                        f"{chunk}\n"
                        f"</context>\n\n"

                        f"<instructions>\n"
                        f"1. Use the reference material in "
                        f"<context> above to answer the user's question.\n"
                        f"2. Provide a concise summary answering "
                        f"the question directly in 2-4 bullet points.\n"
                        f"3. Cite the exact source tags provided "
                        f"in the context.\n"
                        f"</instructions>\n\n"

                        f"User Question: {item['question']}"
                    )

                    record = {
                        "messages": [
                            {
                                "role": "system",
                                "content": SYSTEM_PROMPT.strip(),
                            },
                            {
                                "role": "user",
                                "content": user_content,
                            },
                            {
                                "role": "assistant",
                                "content": item["answer"],
                            },
                        ]
                    }

                    f_out.write(
                        json.dumps(
                            record,
                            ensure_ascii=False,
                        ) + "\n"
                    )

                    f_out.flush()

                    total_generated += 1

                processed_chunks.add(chunk_id)

                print(
                    f"   ✅ Generated {len(pairs)} examples"
                )

    # -------------------------------------------------
    # Summary
    # -------------------------------------------------

    print("\n" + "=" * 60)
    print("DATASET GENERATION COMPLETE")
    print("=" * 60)

    print(
        f"New examples generated: {total_generated}"
    )

    print(
        f"Chunks skipped: {total_skipped}"
    )

    print(
        f"Dataset: {OUTPUT_FILE}"
    )


if __name__ == "__main__":
    main()