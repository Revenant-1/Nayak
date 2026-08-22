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

LEGAL_SYSTEM_PROMPT = (
    "You are an expert legal assistant specializing in Indian criminal law "
    "— BNS, BNSS, and BSA 2023."
)

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

    system_instruction = (
        "Provide a concise, short summary response."
        if "in detail" not in prompt.lower()
        else "Provide a detailed, comprehensive response."
    )

    # Standard messages payload (for general local model and Groq)
    messages = [{"role": "system", "content": system_instruction}]
    for msg in history:
        messages.append(msg)
    messages.append({"role": "user", "content": prompt})

    # Legal persona messages payload
    legal_messages = [
        {"role": "system", "content": f"{LEGAL_SYSTEM_PROMPT} {system_instruction}"}
    ]
    for msg in history:
        legal_messages.append(msg)
    legal_messages.append({"role": "user", "content": prompt})

    response_text = None
    used_model = None

    if force_model is not None:
        # Debug mode: target specific model explicitly
        if force_model not in AVAILABLE_MODELS:
            return (
                f"[AI Debug] Unknown model '{force_model}'. "
                f"Choose from: {', '.join(AVAILABLE_MODELS)}."
            )
        try:
            if force_model == "legal":
                response_text = _call_legal_llama(legal_messages)
            elif force_model == "local":
                response_text = _call_local_llama(messages)
            elif force_model == "gemini":
                response_text = _call_gemini(system_instruction, history, prompt)
            elif force_model == "groq":
                response_text = _call_groq(messages)
            used_model = force_model
        except Exception as e:
            return f"[AI Debug] '{force_model}' failed: {e}"
    else:
        # Cascade fallback mode: Legal Local -> General Local -> Gemini -> Groq
        if legal_llm_client:
            try:
                response_text = _call_legal_llama(legal_messages)
                used_model = "legal"
            except Exception as e:
                if debug:
                    print(f"[AI Debug] Indian Legal Llama failed: {e}")

        if not response_text and local_llm_client:
            try:
                response_text = _call_local_llama(messages)
                used_model = "local"
            except Exception as e:
                if debug:
                    print(f"[AI Debug] General local Llama failed: {e}")

        if not response_text and gemini_client:
            try:
                response_text = _call_gemini(system_instruction, history, prompt)
                used_model = "gemini"
            except Exception as e:
                if debug:
                    print(f"[AI Debug] Gemini failed: {e}")

        if not response_text and groq_client:
            try:
                response_text = _call_groq(messages)
                used_model = "groq"
            except Exception as e:
                if debug:
                    print(f"[AI Debug] Groq failed: {e}")

    if not response_text:
        return "Sorry, all AI services are currently unavailable."

    if debug and used_model:
        print(f"[AI Debug] Response served by: {used_model}")

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