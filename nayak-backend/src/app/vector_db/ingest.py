import os
import sys
import time
from pathlib import Path
from pypdf import PdfReader

# Add 'src' to sys.path so 'app.vector_db' is recognized
SRC_DIR = Path(__file__).resolve().parents[2]
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from app.vector_db.qdrant_service import QdrantService
from app.vector_db.embeddings import EmbeddingService
from app.vector_db.document_processor import create_points


def load_pdfs_from_folder(folder_path: str, chunk_size: int = 700, chunk_overlap: int = 100) -> list[dict]:
    """Reads all PDFs in a folder and splits their text into overlapping chunks."""
    if not os.path.exists(folder_path):
        raise FileNotFoundError(f"Folder not found: {folder_path}")

    documents = []

    for filename in os.listdir(folder_path):
        if not filename.lower().endswith(".pdf"):
            continue

        file_path = os.path.join(folder_path, filename)
        reader = PdfReader(file_path)
        source_name = os.path.splitext(filename)[0]

        for page_idx, page in enumerate(reader.pages, start=1):
            text = page.extract_text()
            if not text:
                continue

            cleaned_text = " ".join(text.split())

            start = 0
            while start < len(cleaned_text):
                end = start + chunk_size
                chunk = cleaned_text[start:end].strip()
                if chunk:
                    documents.append({
                        "text": chunk,
                        "source": source_name,
                        "section": f"Page {page_idx}"
                    })
                start += chunk_size - chunk_overlap

    return documents


def run_ingest(folder_path: str, batch_size: int = 64, max_retries: int = 3):
    db = QdrantService()
    embedder = EmbeddingService()

    print(f"Loading PDFs from '{folder_path}'...")
    documents = load_pdfs_from_folder(folder_path)
    total_docs = len(documents)
    print(f"Extracted {total_docs} text chunks.")

    for i in range(0, total_docs, batch_size):
        batch_docs = documents[i : i + batch_size]
        texts = [doc["text"] for doc in batch_docs]

        vectors = embedder.embed_documents(texts)
        points = create_points(batch_docs, vectors)

        # Retry loop for upserts
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

    print("Ingestion complete.")


if __name__ == "__main__":
    PDF_FOLDER = Path(__file__).resolve().parent / "Data"
    run_ingest(folder_path=str(PDF_FOLDER))