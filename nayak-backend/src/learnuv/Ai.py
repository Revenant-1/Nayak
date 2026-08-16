import os
import json
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types
from groq import Groq
try:
    from llama_cpp import Llama
except ImportError:
    Llama = None
    print("[AI WARN] llama-cpp-python not found. Local Llama models will be unavailable.")

# Ai.py lives in src/learnuv; the project .env is three levels up.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")
HISTORY_FILE = Path(__file__).resolve().parent / "chat_history.json"

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


# Set to False if you want to skip loading the general local model to save
# RAM/VRAM (two local GGUF models loaded at once can be heavy).
LOAD_GENERAL_LOCAL_FALLBACK = True

if Llama:
    # --- Primary local model: Indian Legal Llama ---
    try:
        
        legal_llm_client = Llama.from_pretrained(
            repo_id="GSMS-B/Indian-Legal-Llama-3.2-3B-GGUF",
            filename="*Q4_K_M.gguf",   # recommended quant
            n_ctx=2048,
            verbose=False
        )
        print("[AI INFO] Indian Legal Llama model loaded successfully.")
    except Exception as e:
        print(f"[AI WARN] Failed to load Indian Legal Llama model: {e}")

    # --- Secondary local model: general-purpose fallback ---
    if LOAD_GENERAL_LOCAL_FALLBACK:
        try:
            local_llm_client = Llama.from_pretrained(
                repo_id="QuantFactory/Meta-Llama-3.1-8B-Instruct-GGUF",
                filename="*Q4_K_M.gguf",
                n_ctx=4096,      # Context window size
                verbose=False    # Set to True for detailed loading output
            )
            print("[AI INFO] General local Llama model loaded successfully.")
        except Exception as e:
            print(f"[AI WARN] Failed to load general local Llama model: {e}")
            print("[AI INFO] Falling back to cloud-based AI services.")


def load_history():
    if HISTORY_FILE.exists():
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []


def save_history(history):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=4, ensure_ascii=False)


def new_chat():
    save_history([])


def _call_gemini(system_instruction, history, prompt):
    if not gemini_client:
        raise ValueError("GEMINI_API_KEY is missing from .env")

    contents = []
    for msg in history:
        role = "model" if msg.get("role") == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))
    contents.append(types.Content(role="user", parts=[types.Part(text=prompt)]))

    response = gemini_client.models.generate_content(
        model="gemini-3.5-flash",
        contents=contents,
        config=types.GenerateContentConfig(system_instruction=system_instruction),
    )
    return response.text


def _call_groq(messages):
    if not groq_client:
        raise ValueError("GROQ_API_KEY is missing from .env")
    response = groq_client.chat.completions.create(
        # llama-3.1-8b-instant was retired by Groq on 08/16/2026;
        # openai/gpt-oss-20b is Groq's official recommended replacement.
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


# Names usable with ask_ai(..., force_model=...) for debugging a single
# backend in isolation (bypasses the normal fallback cascade entirely).
AVAILABLE_MODELS = ("legal", "local", "gemini", "groq")


def ask_ai(prompt: str, debug: bool = False, force_model: str | None = None):
    history = load_history()

    system_instruction = (
        "Provide a concise, short summary response."
        if "in detail" not in prompt.lower()
        else "Provide a detailed, comprehensive response."
    )

    # Standard messages, used for the general local model and Groq
    messages = [{"role": "system", "content": system_instruction}]
    for msg in history:
        messages.append(msg)
    messages.append({"role": "user", "content": prompt})

    # Legal-model messages: legal persona + the same length instruction
    legal_messages = [
        {"role": "system", "content": f"{LEGAL_SYSTEM_PROMPT} {system_instruction}"}
    ]
    for msg in history:
        legal_messages.append(msg)
    legal_messages.append({"role": "user", "content": prompt})

    response_text = None
    used_model = None

    if force_model is not None:
        # --- Debug mode: call exactly one backend, no fallback ---
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
        # --- Normal mode: cascade through backends in priority order ---

        # 1) Try Indian Legal Llama first (primary)
        if legal_llm_client:
            try:
                response_text = _call_legal_llama(legal_messages)
                used_model = "legal"
            except Exception as e:
                if debug:
                    print(f"[AI Debug] Indian Legal Llama failed: {e}")

        # 2) Fallback to the general local Llama model
        if not response_text and local_llm_client:
            try:
                response_text = _call_local_llama(messages)
                used_model = "local"
            except Exception as e:
                if debug:
                    print(f"[AI Debug] General local Llama failed: {e}")

        # 3) Fallback to Gemini
        if not response_text:
            try:
                response_text = _call_gemini(system_instruction, history, prompt)
                used_model = "gemini"
            except Exception as e:
                if debug:
                    print(f"[AI Debug] Gemini failed: {e}")

        # 4) Fallback to Groq
        if not response_text:
            try:
                response_text = _call_groq(messages)  # Groq uses the 'messages' format
                used_model = "groq"
            except Exception as e:
                if debug:
                    print(f"[AI Debug] Groq failed: {e}")

    if not response_text:
        return "Sorry, all AI services are currently unavailable."

    if debug and used_model:
        print(f"[AI Debug] Response served by: {used_model}")

    # Save state
    history.append({"role": "user", "content": prompt})
    history.append({"role": "assistant", "content": response_text})
    save_history(history)

    return response_text


if __name__ == "__main__":

    env_path = Path(__file__).resolve().parents[2] / ".env"
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
