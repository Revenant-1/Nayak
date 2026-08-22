try:
    from app.Ai import ask_ai, new_chat
    from app.vector_db import QdrantService
except ImportError:
    from Ai import ask_ai,new_chat
    from vector_db import QdrantService

vector_db = QdrantService()   


def retrieve_legal_context(user_query: str) -> str:   
    try:   
        search_results = vector_db.search(query=user_query, limit=2)   
        context_chunks = [   
            f"[{hit.payload.get('source')} - Sec {hit.payload.get('section')}]: {hit.payload.get('text')}"   
            for hit in search_results   
        ]   
        return "\n".join(context_chunks)   
    except Exception as e:   
        print(f"[VectorDB Warning] Retrieval failed: {e}")   
        return ""   


def processCommand(command: str, session_id: str | None = None) -> str:
    print(f"[Command]: {command}")   
    if any(word in command.lower() for word in ["new chat", "clear memory", "forget conversation", "reset chat"]):   
        new_chat(session_id)
        return "Conversation cleared."   

    legal_context = retrieve_legal_context(command)
    detail_instruction = (
        "Please provide a concise, short legal summary response."   
        if "in detail" not in command.lower()   
        else "Please provide a detailed, comprehensive response."
    )

    if legal_context:
        prompt = (
            f"Relevant Legal Context:\n{legal_context}\n\n"
            f"User Query: {command}\n"
            f"({detail_instruction} Base your answer on the legal context above if applicable.)"
        )
    else:
        prompt = f"{command} ({detail_instruction})"   

    response = ask_ai(prompt, session_id=session_id, user_content=command)
    print(f"[Nayak Response]: {response}")   
    return response   


if __name__ == "__main__":
    test_query = "What does the law say about theft?"
    print(processCommand(test_query))