# app/vector_db/qdrant_service.py
import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient, models
from .embeddings import EmbeddingService

load_dotenv()

REQUIRED_INDEX_FIELDS = ["domain", "sub_domain", "source", "language"]


class QdrantService:
    def __init__(self, collection_name: str = "sih_knowledge_base"):
        self.client = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY"),
            timeout=60.0
        )
        self.collection_name = collection_name
        self.embedder = EmbeddingService()
        self._init_collection(self.embedder.vector_size)

    def _init_collection(self, vector_size: int):
        collections = [c.name for c in self.client.get_collections().collections]
        
        # Create collection if it does not exist
        if self.collection_name not in collections:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=vector_size,
                    distance=models.Distance.COSINE
                )
            )

        # Ensure all required keyword payload indexes exist
        self._ensure_payload_indexes()

    def _ensure_payload_indexes(self):
        """Creates missing payload indexes required for filtered searches and deletions."""
        collection_info = self.client.get_collection(collection_name=self.collection_name)
        existing_indexes = set(collection_info.payload_schema.keys()) if collection_info.payload_schema else set()

        for field in REQUIRED_INDEX_FIELDS:
            if field not in existing_indexes:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field,
                    field_schema=models.PayloadSchemaType.KEYWORD
                )

    def upsert_points(self, points: list, wait: bool = False):
        return self.client.upsert(
            collection_name=self.collection_name,
            points=points,
            wait=wait
        )

    def search(self, query: str, limit: int = 5, domain_filter: str = None):
        query_vector = self.embedder.embed_query(query)
        
        query_filter = None
        if domain_filter:
            query_filter = models.Filter(
                must=[
                    models.FieldCondition(
                        key="domain",
                        match=models.MatchValue(value=domain_filter)
                    )
                ]
            )

        return self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=query_filter,
            limit=limit
        ).points

    def delete_by_source(self, source_name: str, wait: bool = True):
        """Deletes all chunks associated with a specific source file."""
        return self.client.delete(
            collection_name=self.collection_name,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="source",
                            match=models.MatchValue(value=source_name)
                        )
                    ]
                )
            ),
            wait=wait
        )