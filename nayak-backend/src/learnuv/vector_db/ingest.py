try:
    from vector_db.qdrant_service import QdrantService
    from vector_db.embeddings import EmbeddingService
    from vector_db.document_processor import create_points
except ImportError:
    from qdrant_service import QdrantService
    from embeddings import EmbeddingService
    from document_processor import create_points

DOCUMENTS = [
    {"text": "Section 303 of the Bharatiya Nyaya Sanhita deals with theft.", "source": "BNS", "section": "303"},
    {"text": "The Bharatiya Nagarik Suraksha Sanhita deals with criminal procedure.", "source": "BNSS", "section": "General"},
]

def run_ingest():
    db = QdrantService()
    embedder = EmbeddingService()
    
    texts = [doc["text"] for doc in DOCUMENTS]
    vectors = embedder.embed_documents(texts)
    points = create_points(DOCUMENTS, vectors)
    
    db.upsert_points(points)
    print(f"Ingestion complete: {len(points)} records stored.")

if __name__ == "__main__":
    run_ingest()