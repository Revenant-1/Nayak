# test_setup.py
import os
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent

print("✓ Checking imports...")
try:
    from llama_cpp import Llama
    print("  ✓ llama-cpp-python installed")
except ImportError:
    print("  ✗ llama-cpp-python NOT installed")

print("\n✓ Checking model paths...")
legal_model = BACKEND_ROOT / "models" / "llama-3.2-3b-instruct.Q4_K_M.gguf"
print(f"  Legal model exists: {legal_model.exists()}")
if legal_model.exists():
    print(f"    Size: {legal_model.stat().st_size / (1024**3):.2f} GB")

print("\n✓ Checking API keys...")
from dotenv import load_dotenv
load_dotenv()
print(f"  GEMINI_API_KEY: {'✓ Set' if os.getenv('GEMINI_API_KEY') else '✗ Missing'}")
print(f"  GROQ_API_KEY: {'✓ Set' if os.getenv('GROQ_API_KEY') else '✗ Missing'}")