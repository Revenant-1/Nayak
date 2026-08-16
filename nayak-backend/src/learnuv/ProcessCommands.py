try:
    from learnuv.Ai import ask_ai, new_chat
except ImportError:
    from Ai import ask_ai, new_chat

def processCommand(command):
    print(f"[Command]: {command}")
    if any(word in command.lower() for word in ["new chat", "clear memory", "forget conversation", "reset chat"]):
        new_chat()
        return "Conversation cleared."
    
    else:
        if "in detail" not in command.lower():
            prompt = f"{command} (Please provide a concise, short legal summary response.)"
        else:
            prompt = command

        response = ask_ai(prompt)
        print(f"[Nayak Response]: {response}")
        return response