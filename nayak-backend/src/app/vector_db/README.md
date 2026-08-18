1. Prerequisites

    uv: Fast Python package installer and runner (curl -LsSf [https://astral.sh/uv/install.sh](https://astral.sh/uv/install.sh) | sh or brew install uv)

    Python 3.10+ (auto-provisionable via uv python install 3.11)

    Qdrant Instance: Local via Docker or Qdrant Cloud cluster

2. Environment & Dependency Installation

    # Create and activate a virtual environment
    uv venv
    source .venv/bin/activate  
    # On Windows: .venv\Scripts\activate

    # Install required packages
    uv pip install qdrant-client fastembed pypdf python-dotenv

    #Else
        uv add qdrant-client fastembed pypdf python-dotenv

3. Environment ConfigurationCreate a .env file in the project root directory:  
    # Qdrant Cloud / Remote Instance
    QDRANT_URL=https://your-cluster-id.qdrant.tech:6333
    QDRANT_API_KEY=your_qdrant_api_key_here

    
4. Directory Preparation
    Place all PDF documents inside the Data directory located in app/vector_db/:

        app/vector_db/
        ├── Data/
        │   ├── sample_contract.pdf
        │   ├── company_policy.pdf
        │   └── legal_terms.pdf
        ├── __init__.py
        ├── document_processor.py
        ├── embeddings.py
        ├── ingest.py
        └── qdrant_service.py

5. Running Ingestion
    # Execute from the project nayak-backend
    uv run python -m app.vector_db.ingest

    # Or from within app/vector_db/:  
    run python ingest.py