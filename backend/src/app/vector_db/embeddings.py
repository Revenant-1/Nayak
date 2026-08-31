# app/vector_db/embeddings.py
from fastembed import TextEmbedding
from typing import List

class EmbeddingService:
    def __init__(self, model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"):
        """
        Officially supported FastEmbed multilingual model.
        Output vector dimension: 384
        Handles English, Hindi, and 50+ other languages natively.
        """
        self.model = TextEmbedding(model_name=model_name)
        self.vector_size = 384
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [vector.tolist() for vector in self.model.embed(texts)]

    def embed_query(self, query: str) -> List[float]:
        return next(self.model.embed([query])).tolist()