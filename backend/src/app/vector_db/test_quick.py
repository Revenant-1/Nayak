# test_quick.py
from app.vector_db.embeddings import EmbeddingService
from app.vector_db.document_processor import create_points, generate_chunk_id
from app.vector_db.qdrant_service import QdrantService




def run_quick_test():
    print("1. Testing Embeddings...")
    embedder = EmbeddingService()
    test_texts = [
        "Pradhan Mantri Fasal Bima Yojana provides crop insurance.",
        "किसान क्रेडिट कार्ड योजना से ऋण प्राप्त करें।"  # Hindi test
    ]
    vectors = embedder.embed_documents(test_texts)
    assert len(vectors) == 2
    assert len(vectors[0]) == 384, f"Expected 384 dims, got {len(vectors[0])}"
    print(" Embedding generated successfully (Dimension: 384).")

    print("\n2. Testing Point Struct Creation...")
    sample_docs = [
        {
            "text": test_texts[0],
            "source": "pmfby_guide",
            "section": "Page 1",
            "domain": "agriculture",
            "sub_domain": "insurance",
            "file_type": "pdf",
            "language": "en"
        },
        {
            "text": test_texts[1],
            "source": "kcc_scheme",
            "section": "Page 2",
            "domain": "agriculture",
            "sub_domain": "credit",
            "file_type": "pdf",
            "language": "hi"
        }
    ]
    points = create_points(sample_docs, vectors)
    assert len(points) == 2
    assert points[0].payload["domain"] == "agriculture"
    print(" Points created with deterministic UUIDs and payloads.")

    print("\n3. Testing Qdrant Service (Connection & Upsert)...")
    db = QdrantService(collection_name="test_sih_kb")
    db.upsert_points(points, wait=True)
    print(" Sample vectors upserted into Qdrant.")

    print("\n4. Testing Semantic Search & Domain Filtering...")
    query = "crop insurance policy"
    results = db.search(query=query, limit=2, domain_filter="agriculture")
    assert len(results) > 0
    top_hit = results[0]
    print(f" Top result (Score: {top_hit.score:.4f}):")
    print(f"   - Source: {top_hit.payload['source']}")
    print(f"   - Text: {top_hit.payload['text']}")

    print("\n5. Cleaning up test record...")
    db.delete_by_source("pmfby_guide")
    db.delete_by_source("kcc_scheme")
    print(" Cleanup complete. All basic components working!")


if __name__ == "__main__":
    run_quick_test()