try:
    from app.Ai import ask_ai, new_chat
    from app.vector_db import QdrantService
except ImportError:
    from Ai import ask_ai, new_chat
    from vector_db import QdrantService

vector_db = QdrantService()  #[cite: 6]


def retrieve_legal_context(user_query: str) -> str:  #[cite: 6]
    try:  #[cite: 6]
        search_results = vector_db.search(query=user_query, limit=2)  #[cite: 6]
        context_chunks = [  #[cite: 6]
            f"[{hit.payload.get('source')} - Sec {hit.payload.get('section')}]: {hit.payload.get('text')}"  #[cite: 6]
            for hit in search_results  #[cite: 6]
        ]  #[cite: 6]
        return "\n".join(context_chunks)  #[cite: 6]
    except Exception as e:  #[cite: 6]
        print(f"[VectorDB Warning] Retrieval failed: {e}")  #[cite: 6]
        return ""  #[cite: 6]


def processCommand(command: str) -> str:
    print(f"[Command]: {command}")  #[cite: 6]
    if any(word in command.lower() for word in ["new chat", "clear memory", "forget conversation", "reset chat"]):  #[cite: 6]
        new_chat()  #[cite: 6]
        return "Conversation cleared."  #[cite: 6]

    legal_context = retrieve_legal_context(command)
    detail_instruction = (
        "Please provide a concise, short legal summary response."  #[cite: 6]
        if "in detail" not in command.lower()  #[cite: 6]
        else "Please provide a detailed, comprehensive response."
    )

    if legal_context:
        prompt = (
            f"Relevant Legal Context:\n{legal_context}\n\n"
            f"User Query: {command}\n"
            f"({detail_instruction} Base your answer on the legal context above if applicable.)"
        )
    else:
        prompt = f"{command} ({detail_instruction})"  #[cite: 6]

    response = ask_ai(prompt)  #[cite: 6]
    print(f"[Nayak Response]: {response}")  #[cite: 6]
    return response  #[cite: 6]


if __name__ == "__main__":
    test_query = "What does the law say about theft?"
    print(processCommand(test_query))