# app/vector_db/ingest.py
import os
import sys
import time
from pathlib import Path
from pypdf import PdfReader
from bs4 import BeautifulSoup

SRC_DIR = Path(__file__).resolve().parents[2]
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from app.vector_db.qdrant_service import QdrantService
from app.vector_db.embeddings import EmbeddingService
from app.vector_db.document_processor import create_points


def chunk_text(text: str, chunk_size: int = 800, chunk_overlap: int = 150) -> list[str]:
    """Splits normalized text into overlapping chunks."""
    cleaned_text = " ".join(text.split())
    chunks = []
    start = 0
    while start < len(cleaned_text):
        end = start + chunk_size
        chunk = cleaned_text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += chunk_size - chunk_overlap
    return chunks


def parse_pdf(file_path: Path) -> list[dict]:
    reader = PdfReader(str(file_path))
    chunks = []
    for page_idx, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        for chunk in chunk_text(text):
            chunks.append({
                "text": chunk,
                "section": f"Page {page_idx}"
            })
    return chunks


def parse_html(file_path: Path) -> list[dict]:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        soup = BeautifulSoup(f.read(), "html.parser")
    
    # Strip script and style tags
    for tag in soup(["script", "style", "nav", "footer"]):
        tag.decompose()
        
    text = soup.get_text(separator=" ")
    return [{"text": chunk, "section": "Web Document"} for chunk in chunk_text(text)]


def parse_image_placeholder(file_path: Path) -> list[dict]:
    """
    Fallback for images like G002_CPGRAMS_Redress_Process_Flow.jpg.
    Replace this with an actual OCR / Vision API call if needed.
    """
    summary = f"CPGRAMS Grievance Redressal Process Flow Chart (Source: {file_path.name})"
    return [{"text": summary, "section": "Flowchart Diagram"}]


def load_knowledge_base(base_dir: str) -> list[dict]:
    """Recursively walks through SIH_RAG_Dataset/knowledge_base."""
    root_path = Path(base_dir)
    documents = []

    for file_path in root_path.rglob("*"):
        if not file_path.is_file():
            continue

        # Extract hierarchical metadata from directory structure
        # Example: knowledge_base/agriculture/pmfby/A001.pdf
        rel_parts = file_path.relative_to(root_path).parts
        domain = rel_parts[0] if len(rel_parts) > 1 else "general"
        sub_domain = rel_parts[1] if len(rel_parts) > 2 else "general"
        source_name = file_path.stem
        ext = file_path.suffix.lower()

        is_hindi = "hindi" in file_path.name.lower() or "hindi" in str(file_path).lower()
        language = "hi" if is_hindi else "en"

        parsed_items = []
        if ext == ".pdf":
            parsed_items = parse_pdf(file_path)
            file_type = "pdf"
        elif ext in [".html", ".htm"]:
            parsed_items = parse_html(file_path)
            file_type = "html"
        elif ext in [".jpg", ".jpeg", ".png"]:
            parsed_items = parse_image_placeholder(file_path)
            file_type = "image"
        else:
            continue

        for item in parsed_items:
            documents.append({
                "text": item["text"],
                "source": source_name,
                "section": item["section"],
                "domain": domain,
                "sub_domain": sub_domain,
                "file_type": file_type,
                "language": language
            })

    return documents


def run_ingest(base_dir: str, batch_size: int = 64, max_retries: int = 3):
    db = QdrantService(collection_name="sih_knowledge_base")
    embedder = EmbeddingService()

    print(f"Loading knowledge base recursively from '{base_dir}'...")
    documents = load_knowledge_base(base_dir)
    total_docs = len(documents)
    print(f"Extracted {total_docs} text chunks across all domains.")

    for i in range(0, total_docs, batch_size):
        batch_docs = documents[i : i + batch_size]
        texts = [doc["text"] for doc in batch_docs]

        vectors = embedder.embed_documents(texts)
        points = create_points(batch_docs, vectors)

        for attempt in range(1, max_retries + 1):
            try:
                db.upsert_points(points, wait=False)
                print(f"Stored {min(i + batch_size, total_docs)}/{total_docs} records...")
                break
            except Exception as e:
                if attempt == max_retries:
                    print(f"Failed batch {i}-{i+batch_size} after {max_retries} attempts: {e}")
                    raise e
                print(f"Upload failed on attempt {attempt}. Retrying in 3s...")
                time.sleep(3)

    print("SIH Knowledge Base ingestion complete.")


if __name__ == "__main__":
    DATASET_DIR = Path(__file__).resolve().parent / "Data" / "knowledge_base"
    run_ingest(base_dir=str(DATASET_DIR))