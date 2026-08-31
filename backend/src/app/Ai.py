import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types
from groq import Groq
from app.models.models import Message, Session, SessionLocal

try:
    from llama_cpp import Llama
except ImportError:
    Llama = None
    print("[AI WARN] llama-cpp-python not found. Local Llama models will be unavailable.")

# Resolve paths relative to backend/ (3 levels up from src/app/Ai.py)
BACKEND_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_ROOT / ".env")
gemini_key = os.getenv("GEMINI_API_KEY")
groq_key = os.getenv("GROQ_API_KEY")

gemini_client = genai.Client(api_key=gemini_key) if gemini_key else None
groq_client = Groq(api_key=groq_key) if groq_key else None

legal_llm_client = None   # Primary: Indian Legal Llama (local)
local_llm_client = None   # Secondary local fallback: general-purpose Llama

LEGAL_SYSTEM_PROMPT = """You are "Nayak", an authoritative and precise AI legal assistant specializing in Indian Law, with focus on the new criminal codes:
- Bharatiya Nyaya Sanhita, 2023 (BNS)
- Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)
- Bharatiya Sakshya Adhiniyam, 2023 (BSA)
- Key Central Acts, Government Schemes, and Grievance Mechanisms (e.g., CPGRAMS, PMFBY, KCC).

### CORE RULES:
1. Grounding & Truthfulness: Rely strictly on the provided context. If the context does not contain enough information to answer definitively, state clearly what is known and specify that additional details are needed. NEVER fabricate section numbers, punishments, or case citations.
2. Citations: Always cite the source document, Act, and Section number when making legal assertions (e.g., "[Source: BNS - Section 303(2)]").
3. Language Adaptation: If the user queries in Hindi, respond in fluent Hindi. If in English, respond in English. Maintain standard legal terminology.
4. Structure & Clarity:
   - State the direct answer or legal position first.
   - Break down applicable sections, penalties, or procedures using bullet points.
   - Use plain, accessible language while retaining legal accuracy.
5. Legal Disclaimer: Always include a brief one-line note when advising on active legal issues: "Disclaimer: This is for informational purposes and does not constitute formal legal counsel."
"""

# Set to False to skip loading a second local GGUF model and save RAM
LOAD_GENERAL_LOCAL_FALLBACK = False

# Model paths pointing to backend/models/
LEGAL_MODEL_PATH = BACKEND_ROOT / "models" / "llama-3.2-3b-instruct.Q4_K_M.gguf"
LOCAL_MODEL_PATH = BACKEND_ROOT / "models" / "modelName.gguf"

# --- Primary: Indian Legal Llama ---
if Llama and LEGAL_MODEL_PATH.exists():
    try:
        legal_llm_client = Llama(
            model_path=str(LEGAL_MODEL_PATH),
            n_ctx=2048,
            n_gpu_layers=-1,  # Offload all layers to Apple Silicon GPU (Metal)
            verbose=False
        )
        print("[AI INFO] Legal Llama loaded.")
    except Exception as e:
        print(f"[AI WARN] Legal Llama failed to initialize: {e}")
elif not Llama:
    print("[AI INFO] llama-cpp-python not available. Using cloud fallbacks.")
else:
    print(f"[AI INFO] Legal Llama not found at {LEGAL_MODEL_PATH.name}. Using cloud fallbacks.")

# --- Secondary: General Local Fallback ---
if Llama and LOAD_GENERAL_LOCAL_FALLBACK and LOCAL_MODEL_PATH.exists():
    try:
        local_llm_client = Llama(
            model_path=str(LOCAL_MODEL_PATH),
            n_ctx=2048,
            n_gpu_layers=-1,
            verbose=False
        )
        print("[AI INFO] Local Llama loaded.")
    except Exception as e:
        print(f"[AI WARN] Local Llama failed to initialize: {e}")
elif Llama and LOAD_GENERAL_LOCAL_FALLBACK and not LOCAL_MODEL_PATH.exists():
    print(f"[AI INFO] General Local Llama not found at {LOCAL_MODEL_PATH.name}.")


def create_chat_session(user_id: str | None = None) -> str:
    db = SessionLocal()
    try:
        chat_session = Session(user_id=user_id, lang_used="en", mode="text")
        db.add(chat_session)
        db.commit()
        db.refresh(chat_session)
        return chat_session.session_id
    finally:
        db.close()


def load_history(session_id: str) -> list[dict[str, str]]:
    db = SessionLocal()
    try:
        messages = (
            db.query(Message)
            .filter(Message.session_id == session_id)
            .order_by(Message.timestamp, Message.msg_id)
            .all()
        )
        return [{"role": message.role, "content": message.content} for message in messages]
    finally:
        db.close()


def save_messages(session_id: str, user_content: str, assistant_content: str) -> None:
    db = SessionLocal()
    try:
        db.add_all(
            [
                Message(session_id=session_id, role="user", content=user_content),
                Message(session_id=session_id, role="assistant", content=assistant_content),
            ]
        )
        db.commit()
    finally:
        db.close()


def new_chat(session_id: str | None = None) -> str:
    if session_id:
        db = SessionLocal()
        try:
            chat_session = db.get(Session, session_id)
            if chat_session:
                from datetime import datetime
                chat_session.ended_at = datetime.utcnow()
                db.commit()
        finally:
            db.close()
    return create_chat_session()


def _call_gemini(system_instruction, history, prompt):
    if not gemini_client:
        raise ValueError("GEMINI_API_KEY is missing from .env")

    contents = []
    for msg in history:
        role = "model" if msg.get("role") == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))
    contents.append(types.Content(role="user", parts=[types.Part(text=prompt)]))

    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=contents,
        config=types.GenerateContentConfig(system_instruction=system_instruction),
    )
    return response.text


def _call_groq(messages):
    if not groq_client:
        raise ValueError("GROQ_API_KEY is missing from .env")
    response = groq_client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=messages
    )
    return response.choices[0].message.content


def _call_legal_llama(messages):
    if not legal_llm_client:
        raise ValueError("Indian Legal Llama model is not available.")
    response = legal_llm_client.create_chat_completion(
        messages=messages,
        max_tokens=300,
        temperature=0.1
    )
    return response["choices"][0]["message"]["content"]


def _call_local_llama(messages):
    if not local_llm_client:
        raise ValueError("General local Llama model is not available.")
    response = local_llm_client.create_chat_completion(
        messages=messages,
        max_tokens=512,
        temperature=0.7
    )
    return response["choices"][0]["message"]["content"]


# Available backends for isolation/debugging via force_model
AVAILABLE_MODELS = ("legal", "local", "gemini", "groq")


# Inside ask_ai() in Ai.py

def ask_ai(
    prompt: str,
    debug: bool = False,
    force_model: str | None = None,
    session_id: str | None = None,
    user_content: str | None = None,
):
    if not session_id:
        session_id = create_chat_session()
    history = load_history(session_id)

    # Unified legal system prompt across all model providers
    messages = [{"role": "system", "content": LEGAL_SYSTEM_PROMPT}]
    for msg in history:
        messages.append(msg)
    messages.append({"role": "user", "content": prompt})

    response_text = None
    used_model = None

    if force_model is not None:
        if force_model not in AVAILABLE_MODELS:
            return f"[AI Debug] Unknown model '{force_model}'."
        try:
            if force_model == "legal":
                response_text = _call_legal_llama(messages)
            elif force_model == "local":
                response_text = _call_local_llama(messages)
            elif force_model == "gemini":
                response_text = _call_gemini(LEGAL_SYSTEM_PROMPT, history, prompt)
            elif force_model == "groq":
                response_text = _call_groq(messages)
            used_model = force_model
        except Exception as e:
            return f"[AI Debug] '{force_model}' failed: {e}"
    else:
        # Cascade fallback: Legal Local -> General Local -> Gemini -> Groq
        for caller, name in [
            (lambda: _call_legal_llama(messages), "legal"),
            (lambda: _call_local_llama(messages), "local"),
            (lambda: _call_gemini(LEGAL_SYSTEM_PROMPT, history, prompt), "gemini"),
            (lambda: _call_groq(messages), "groq"),
        ]:
            try:
                response_text = caller()
                used_model = name
                break
            except Exception as e:
                if debug:
                    print(f"[AI Debug] {name} failed: {e}")

    if not response_text:
        return "Sorry, all AI services are currently unavailable."

    # Save clean user command rather than the full XML context block to message history
    save_messages(session_id, user_content or prompt, response_text)

    return response_text


if __name__ == "__main__":
    env_path = BACKEND_ROOT / ".env"
    print(f"Loading environment variables from: {env_path}")

    current_model = None  # None = normal cascade/fallback behavior

    def _print_model_help():
        print(
            "\n[AI] Model switch commands:\n"
            f"  model <{'|'.join(AVAILABLE_MODELS)}|auto>  - switch backend\n"
            "  model                              - show current backend\n"
            "  exit                                - quit\n"
        )

    _print_model_help()
    print(f"[AI] Currently: {current_model or 'auto (cascade fallback)'}\n")

    while True:
        question = input("You: ").strip()
        if not question:
            continue

        if question.lower() == "exit":
            break

        if question.lower() == "model":
            print(f"[AI] Currently: {current_model or 'auto (cascade fallback)'}\n")
            continue

        if question.lower().startswith("model "):
            choice = question.split(" ", 1)[1].strip().lower()
            if choice == "auto":
                current_model = None
                print("[AI] Switched to: auto (cascade fallback)\n")
            elif choice in AVAILABLE_MODELS:
                current_model = choice
                print(f"[AI] Switched to: {choice}\n")
            else:
                print(f"[AI] Unknown model '{choice}'. Choose from: {', '.join(AVAILABLE_MODELS)}, auto\n")
            continue

        print("\nNayak:", ask_ai(question, debug=True, force_model=current_model))