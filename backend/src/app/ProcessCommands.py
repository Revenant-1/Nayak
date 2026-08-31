import sys
from pathlib import Path

# Ensure 'src' is in sys.path for direct script execution
SRC_DIR = Path(__file__).resolve().parents[1]
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from app.Ai import ask_ai, new_chat
from app.vector_db import QdrantService

vector_db = QdrantService()

vector_db = QdrantService()


def retrieve_legal_context(user_query: str, limit: int = 3) -> str:
    """Queries Qdrant vector database and returns formatted context chunks."""
    try:
        search_results = vector_db.search(query=user_query, limit=limit)
        if not search_results:
            return ""

        context_chunks = []
        for i, hit in enumerate(search_results, start=1):
            source = hit.payload.get("source", "Unknown")
            section = hit.payload.get("section", "General")
            text = hit.payload.get("text", "").strip()
            context_chunks.append(
                f"[Doc {i} | Source: {source} | Section: {section}]\n{text}"
            )
        return "\n\n".join(context_chunks)
    except Exception as e:
        print(f"[VectorDB Warning] Retrieval failed: {e}")
        return ""


def format_rag_prompt(command: str, legal_context: str, is_detailed: bool) -> str:
    """Structures retrieved knowledge chunks with XML tags and model instructions."""
    detail_guideline = (
        "Provide a comprehensive, in-depth breakdown covering definitions, exceptions, and procedural steps."
        if is_detailed
        else "Provide a concise summary answering the question directly in 2-4 bullet points."
    )

    if legal_context:
        return f"""<context>
{legal_context}
</context>

<instructions>
1. Use the reference material in <context> above to answer the user's question.
2. {detail_guideline}
3. Cite the exact source tags provided in the context (e.g., [Doc 1 | Source: X | Section: Y]).
4. If the context does not cover the question, state that the provided records do not contain the answer, but provide general legal information if known under Indian law.
</instructions>

User Question: {command}"""
    else:
        return f"{command}\n\nNote: {detail_guideline}"


def processCommand(command: str, session_id: str | None = None) -> str:
    print(f"[Command]: {command}")
    
    # Handle conversation reset keywords
    if any(word in command.lower() for word in ["new chat", "clear memory", "forget conversation", "reset chat"]):
        new_chat(session_id)
        return "Conversation cleared."

    # 1. Check if user requested detailed output
    is_detailed = "in detail" in command.lower() or "detailed" in command.lower()

    # 2. Retrieve relevant context from vector database
    legal_context = retrieve_legal_context(command, limit=3)

    # 3. Format the prompt with XML context delimiters
    prompt = format_rag_prompt(command, legal_context, is_detailed)

    # 4. Generate response and pass clean user command for history storage
    response = ask_ai(prompt, session_id=session_id, user_content=command)
    print(f"[Nayak Response]: {response}")
    return response


if __name__ == "__main__":
    test_query = "What does the law say about theft?"
    print(processCommand(test_query))