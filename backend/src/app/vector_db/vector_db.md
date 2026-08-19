## 1. How `ingest.py` Converts Raw Data into Chunks

The chunking process is handled inside the `load_pdfs_from_folder()` function in `ingest.py`. It follows a 5-step pipeline:

```
[ PDF File on Disk ]
        │
        ▼
[ Page-by-Page Text Extraction (PdfReader) ]
        │
        ▼
[ Whitespace Normalization (" ".join(text.split())) ]
        │
        ▼
[ Sliding Window Chunking (chunk_size=700, chunk_overlap=100) ]
        │
        ▼
[ Structured Metadata Dictionary ({text, source, section}) ]

```

### The Step-by-Step Chunking Mechanism:

1. **File Reading:** The script scans the folder for files ending with `.pdf` and uses `pypdf.PdfReader` to access the document page by page.
2. **Text Normalization:**
```python
cleaned_text = " ".join(text.split())

```


`text.split()` splits the raw string by any whitespace (tabs, consecutive spaces, newline characters `\n`), and `" ".join(...)` reassembles them with a single space. This removes broken formatting and irregular line breaks.
3. **Sliding Window Chunking:**
The function slices the cleaned text using character indices:
* **`chunk_size = 700`**: Each chunk is up to 700 characters long.
* **`chunk_overlap = 100`**: The next chunk steps backward by 100 characters to preserve context across boundaries.
* **Step Size**: $\text{step} = \text{chunk\_size} - \text{chunk\_overlap} = 700 - 100 = 600\text{ characters}$.


```
Original Text: [==================================================]
Chunk 1:       [   0 to 700   ]
Chunk 2:                   [ 600 to 1300  ]   <-- (100 char overlap with Chunk 1)
Chunk 3:                               [ 1200 to 1900 ]

```


4. **Document Construction:**
Each text chunk is packaged into a dictionary containing metadata:
```python
{
    "text": "Extracted chunk text...",
    "source": "contract_agreement",  # File name without extension
    "section": "Page 1"               # Page number
}

```



---

## 2. Import & Dependency Graph

Here is how all five files connect and share components:

```
                  ┌──────────────────────┐
                  │    embeddings.py     │
                  │  (EmbeddingService)  │
                  └──────────┬───────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
┌──────────────────────┐     │     ┌──────────────────────┐
│  qdrant_service.py   │     │     │     __init__.py      │
│   (QdrantService)    │     │     └──────────────────────┘
└──────────┬───────────┘     │
           │                 │
           │    ┌────────────┴───────────┐
           │    │  document_processor.py │
           │    │    (create_points)     │
           │    └────────────┬───────────┘
           │                 │
           ▼                 ▼
     ┌─────────────────────────────┐
     │          ingest.py          │
     │      (Execution Entry)      │
     └─────────────────────────────┘

```

### Import Summary Table

| File | What it Imports | Where it's Imported From |
| --- | --- | --- |
| **`__init__.py`** | `QdrantService`<br>

<br>`EmbeddingService` | `qdrant_service.py`<br>

<br>`embeddings.py` |
| **`document_processor.py`** | `uuid`<br>

<br>`List, Dict, Any`<br>

<br>`models` | Python standard library<br>

<br>`typing` (Standard library)<br>

<br>`qdrant_client` |
| **`embeddings.py`** | `TextEmbedding`<br>

<br>`List` | `fastembed`<br>

<br>`typing` |
| **`qdrant_service.py`** | `os`<br>

<br>`load_dotenv`<br>

<br>`QdrantClient, models`<br>

<br>`EmbeddingService` | Standard library<br>

<br>`dotenv`<br>

<br>`qdrant_client`<br>

<br>`embeddings.py` |
| **`ingest.py`** | `os, sys, time, Path`<br>

<br>`PdfReader`<br>

<br>`QdrantService`<br>

<br>`EmbeddingService`<br>

<br>`create_points` | Standard library<br>

<br>`pypdf`<br>

<br>`app.vector_db.qdrant_service`<br>

<br>`app.vector_db.embeddings`<br>

<br>`app.vector_db.document_processor` |

---

## 3. Detailed Line-by-Line / Component Explanation

---

### `__init__.py`

```python
from .qdrant_service import QdrantService
from .embeddings import EmbeddingService

__all__ = ["QdrantService", "EmbeddingService"]

```

* **Line 1–2**: Exposes `QdrantService` and `EmbeddingService` at the package root level (`app.vector_db`) using relative imports (`.`).
* **Line 4**: `__all__` explicitly defines which symbols are exported when a user writes `from app.vector_db import *`.

---

### `embeddings.py`

```python
from fastembed import TextEmbedding
from typing import List

class EmbeddingService:
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model = TextEmbedding(model_name=model_name)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [vector.tolist() for vector in self.model.embed(texts)]

    def embed_query(self, query: str) -> List[float]:
        return next(self.model.embed([query])).tolist()

```

* **`from fastembed import TextEmbedding`**: Imports FastEmbed, a lightweight library for generating dense vector embeddings locally without heavy PyTorch dependencies.
* **`def __init__(self, model_name: ...)`**: Initializes the embedding model. Defaults to `BAAI/bge-small-en-v1.5`, which generates **384-dimensional** vector embeddings.
* **`def embed_documents(self, texts: List[str])`**:
* Accepts a list of document strings.
* Calls `self.model.embed(texts)`, which yields NumPy arrays.
* `vector.tolist()` converts each vector into a native Python `list` of floats suitable for JSON serialization and Qdrant storage.


* **`def embed_query(self, query: str)`**:
* Accepts a single search query string.
* Runs `self.model.embed([query])` and uses `next(...)` to extract the first (and only) vector as a `List[float]`.



---

### `document_processor.py`

```python
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

```

* **`def create_points(...)`**: Converts raw document metadata and their corresponding vector embeddings into Qdrant's expected point format (`models.PointStruct`).
* **`zip(documents, vectors)`**: Iterates over both document dictionaries and embedding vectors in parallel.
* **`point_id = doc.get("id", str(uuid.uuid4()))`**: Uses an existing `"id"` if present; otherwise generates a unique UUID4 string.
* **`models.PointStruct(...)`**:
* **`id`**: Unique identifier for the point in Qdrant.
* **`vector`**: The 384-dimensional float array.
* **`payload`**: Key-value metadata stored alongside the vector (`text` chunk, `source` PDF name, and `section`/page number).



---

### `qdrant_service.py`

```python
import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient, models
from .embeddings import EmbeddingService

load_dotenv()

```

* **`load_dotenv()`**: Loads environment variables from a `.env` file into `os.environ` (such as `QDRANT_URL` and `QDRANT_API_KEY`).

```python
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

```

* **`__init__`**: Connects to the Qdrant instance via URL and API key. Sets a 60-second network timeout, sets up the internal `EmbeddingService`, and ensures the collection exists.

```python
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

```

* **`_init_collection`**: Fetches all existing collection names. If `self.collection_name` doesn't exist, it creates it with the given `vector_size` (384) and sets the similarity metric to **Cosine Distance**.

```python
    def upsert_points(self, points: list, wait: bool = False):
        return self.client.upsert(
            collection_name=self.collection_name,
            points=points,
            wait=wait  # Do not block the network socket waiting for full disk commit
        )

```

* **`upsert_points`**: Inserts or updates points in the collection. Setting `wait=False` makes the operation asynchronous on the server side, speeding up ingestion.

```python
    def search(self, query: str, limit: int = 3):
        query_vector = self.embedder.embed_query(query)
        return self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=limit
        ).points

```

* **`search`**: Converts a text search query into a vector using `self.embedder.embed_query(query)` and queries Qdrant for the top `limit` (default 3) nearest neighbors.

---

### `ingest.py`

```python
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

```

* **`SRC_DIR = Path(...).parents[2]`**: Resolves the root project path two directories up and inserts it into `sys.path`. This ensures absolute module imports (`app.vector_db.*`) work regardless of where the script is executed from.

```python
def load_pdfs_from_folder(folder_path: str, chunk_size: int = 700, chunk_overlap: int = 100) -> list[dict]:
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

```

* Checks if `folder_path` exists.
* Iterates through every file; ignores any non-PDF files.
* Extracts text per page using `pypdf.PdfReader`.
* Sanitizes whitespace with `" ".join(text.split())`.
* Applies the sliding window loop (`start += chunk_size - chunk_overlap`) to slice text into overlapping chunks.
* Appends each chunk along with the filename (`source`) and page number (`section`).

```python
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

```

* Initializes `db` and `embedder`.
* Loads and chunks all PDFs in `folder_path`.
* Batches the chunks (default 64 at a time) to prevent memory bottlenecks:
1. Extracts the raw text strings from the batch.
2. Embeds the 64 texts into vectors using `embedder.embed_documents(texts)`.
3. Formats them into Qdrant `PointStruct` objects using `create_points(batch_docs, vectors)`.
4. Upserts to Qdrant inside a retry loop (`max_retries = 3`) with a 3-second backoff in case of temporary network drops.



```python
if __name__ == "__main__":
    PDF_FOLDER = Path(__file__).resolve().parent / "Data"
    run_ingest(folder_path=str(PDF_FOLDER))

```

* Entry point when executed directly (`python ingest.py`). Looks for a directory named `Data` in the same directory as `ingest.py` and triggers `run_ingest()`.