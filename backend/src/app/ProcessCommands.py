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


def retrieve_legal_context(user_query: str, limit: int = 4) -> str:
    """Queries Qdrant and formats clean context blocks for the LLM."""
    try:
        search_results = vector_db.search(query=user_query, limit=limit)
        if not search_results:
            return ""

        context_chunks = []
        for i, hit in enumerate(search_results, start=1):
            source = hit.payload.get("source", "Unknown").replace("_", " ")
            section = hit.payload.get("section", "General")
            text = hit.payload.get("text", "").strip()
            # Clean structure without nested brackets
            context_chunks.append(
                f"--- Reference Document {i} ---\nDocument: {source}\nSection: {section}\nContent: {text}"
            )
        return "\n\n".join(context_chunks)
    except Exception as e:
        print(f"[VectorDB Warning] Retrieval failed: {e}")
        return ""


def format_rag_prompt(command: str, legal_context: str, is_detailed: bool) -> str:
    detail_guideline = (
        "Provide a comprehensive, in-depth breakdown covering conditions and procedures."
        if is_detailed
        else "Provide a concise summary answering directly in 2-3 bullet points."
    )

    if legal_context:
        return f"""<context>
{legal_context}
</context>

<instructions>
1. Answer the question strictly using the facts in the <context> above.
2. {detail_guideline}
3. Citation Rule: Cite your source at the end of the answer in clean parentheses: (Source: <Document Name>, <Section/Page>). Do NOT invent or output raw internal doc tags.
4. Grounding: If the context discusses a policy/scheme (such as PMFBY), do not fabricate statutory Acts or Section numbers. If an exact condition (like timelines or percentage thresholds) is not in the context, explicitly state that it is not specified.
</instructions>

User Question: {command}"""
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
    legal_context = retrieve_legal_context(command, limit=5)
    

    # 3. Format the prompt with XML context delimiters
    prompt = format_rag_prompt(command, legal_context, is_detailed)

    # 4. Generate response and pass clean user command for history storage
    response = ask_ai(prompt, session_id=session_id, user_content=command)
    print(f"[Nayak Response]: {response}")
    return response


if __name__ == "__main__":
    test_query = "What does the law say about theft?"
    print(processCommand(test_query))