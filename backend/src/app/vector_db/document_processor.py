import uuid
from typing import List, Dict, Any
from qdrant_client import models

def create_points(documents: List[Dict[str, Any]], vectors: List[List[float]]) -> List[models.PointStruct]:
    points = []
    for i, (doc, vector) in enumerate(zip(documents, vectors)):
        point_id = doc.get("id", str(uuid.uuid4()))
        points.append(
            models.PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "text": doc.get("text", ""),
                    "source": doc.get("source", "Unknown"),
                    "section": doc.get("section", "General")
                }
            )
        )
    return points