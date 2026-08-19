import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient, models
from .embeddings import EmbeddingService

load_dotenv()

class QdrantService:
    def __init__(self, collection_name: str = "nayak_legal", vector_size: int = 384):
        self.client = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY"),
            timeout=60.0  # Increased timeout from default to prevent dropouts
        )
        self.collection_name = collection_name
        self.embedder = EmbeddingService()
        self._init_collection(vector_size)

    def _init_collection(self, vector_size: int):
        collections = [c.name for c in self.client.get_collections().collections]
        if self.collection_name not in collections:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=vector_size,
                    distance=models.Distance.COSINE
                )
            )

    def upsert_points(self, points: list, wait: bool = False):
        return self.client.upsert(
            collection_name=self.collection_name,
            points=points,
            wait=wait  # Do not block the network socket waiting for full disk commit
        )

    def search(self, query: str, limit: int = 3):
        query_vector = self.embedder.embed_query(query)
        return self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=limit
        ).points