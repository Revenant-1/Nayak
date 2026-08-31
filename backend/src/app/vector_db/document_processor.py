# app/vector_db/document_processor.py
import uuid
import hashlib
from typing import List, Dict, Any
from qdrant_client import models

def generate_chunk_id(source: str, section: str, text: str) -> str:
    """Generates a reproducible, standard UUID for a chunk."""
    unique_key = f"{source}:{section}:{text}"
    # Qdrant requires IDs to be either unsigned integers or valid UUID strings
    return str(uuid.uuid5(uuid.NAMESPACE_URL, unique_key))

def create_points(documents: List[Dict[str, Any]], vectors: List[List[float]]) -> List[models.PointStruct]:
    points = []
    for doc, vector in zip(documents, vectors):
        # Generate deterministic ID if 'id' is not already provided
        point_id = doc.get("id") or generate_chunk_id(
            source=doc.get("source", "Unknown"),
            section=doc.get("section", "General"),
            text=doc.get("text", "")
        )
        
        points.append(
            models.PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "text": doc.get("text", ""),
                    "source": doc.get("source", "Unknown"),
                    "section": doc.get("section", "General"),
                    "domain": doc.get("domain", "general"),
                    "sub_domain": doc.get("sub_domain", "general"),
                    "file_type": doc.get("file_type", "unknown"),
                    "language": doc.get("language", "en")
                }
            )
        )
    return points