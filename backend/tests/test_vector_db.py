# tests/test_vector_db.py
import sys
from pathlib import Path
from unittest.mock import patch
import pytest
from qdrant_client import QdrantClient

# Ensure 'src' is discoverable when running pytest from the backend root
SRC_PATH = Path(__file__).resolve().parents[1] / "src"
if str(SRC_PATH) not in sys.path:
    sys.path.insert(0, str(SRC_PATH))

from app.vector_db.document_processor import generate_chunk_id, create_points
from app.vector_db.embeddings import EmbeddingService
from app.vector_db.ingest import chunk_text
from app.vector_db.qdrant_service import QdrantService


# --- 1. Unit Tests: Document Processor & Chunking ---

def test_generate_chunk_id_reproducibility():
    """Ensure chunk IDs are deterministic across runs."""
    id1 = generate_chunk_id("doc1", "Page 1", "Sample text content")
    id2 = generate_chunk_id("doc1", "Page 1", "Sample text content")
    id3 = generate_chunk_id("doc1", "Page 1", "Different text")

    assert id1 == id2
    assert id1 != id3


def test_chunk_text_sliding_window():
    """Verify overlapping window text chunking."""
    sample_text = "word " * 300  # 1500 characters
    chunks = chunk_text(sample_text, chunk_size=500, chunk_overlap=100)

    assert len(chunks) >= 3
    assert len(chunks[0]) <= 500


def test_create_points_payload_structure():
    """Check that PointStruct maintains correct payload fields."""
    docs = [{
        "text": "sample text",
        "source": "A001",
        "section": "Page 1",
        "domain": "agriculture",
        "sub_domain": "pmfby"
    }]
    vectors = [[0.1] * 384]

    points = create_points(docs, vectors)
    assert len(points) == 1
    assert points[0].payload["source"] == "A001"
    assert points[0].payload["domain"] == "agriculture"
    assert points[0].payload["language"] == "en"


# --- 2. Unit Tests: Embedding Service ---

@pytest.fixture(scope="module")
def embedder():
    return EmbeddingService()


def test_embedding_dimensions(embedder):
    """Ensure vectors conform to 384-dimension configuration."""
    vector = embedder.embed_query("Test query")
    assert isinstance(vector, list)
    assert len(vector) == 384


def test_multilingual_embedding(embedder):
    """Verify embedding generation on Hindi text."""
    texts = ["PM Fasal Bima", "प्रधानमंत्री फसल बीमा योजना"]
    vectors = embedder.embed_documents(texts)
    assert len(vectors) == 2
    assert len(vectors[0]) == 384
    assert len(vectors[1]) == 384


# --- 3. Integration Tests: In-Memory Qdrant Service ---

@pytest.fixture
def in_memory_qdrant():
    """Isolated in-memory Qdrant instance (no remote network needed)."""
    with patch("app.vector_db.qdrant_service.QdrantClient") as mock_client:
        real_in_memory_client = QdrantClient(":memory:")
        mock_client.return_value = real_in_memory_client
        service = QdrantService(collection_name="test_collection")
        yield service


def test_qdrant_upsert_and_search(in_memory_qdrant, embedder):
    """Test full cycle: indexing points, running vector search with filters."""
    docs = [
        {
            "text": "Farming subsidies and crop loans",
            "source": "agri_01",
            "section": "Page 1",
            "domain": "agriculture"
        },
        {
            "text": "Income tax rebate regulations",
            "source": "fin_01",
            "section": "Page 1",
            "domain": "finance"
        }
    ]
    texts = [d["text"] for d in docs]
    vectors = embedder.embed_documents(texts)
    points = create_points(docs, vectors)

    in_memory_qdrant.upsert_points(points, wait=True)

    # Search without filter
    results = in_memory_qdrant.search("crop insurance loans", limit=1)
    assert len(results) == 1
    assert results[0].payload["source"] == "agri_01"

    # Search with domain filter
    filtered_results = in_memory_qdrant.search(
        query="loans and taxes",
        limit=2,
        domain_filter="finance"
    )
    assert len(filtered_results) == 1
    assert filtered_results[0].payload["domain"] == "finance"


def test_qdrant_delete_by_source(in_memory_qdrant, embedder):
    """Test chunk deletion based on source name."""
    docs = [{"text": "Delete test chunk", "source": "temp_file", "section": "Page 1"}]
    vectors = embedder.embed_documents(["Delete test chunk"])
    points = create_points(docs, vectors)

    in_memory_qdrant.upsert_points(points, wait=True)
    in_memory_qdrant.delete_by_source("temp_file")

    results = in_memory_qdrant.search("Delete test chunk", limit=5)
    assert len(results) == 0