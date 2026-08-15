# script.py
import os
import platform
import subprocess
import sys
import threading

# --- Configuration ---
REPO_URL = "https://github.com/Danish-khan-coder/Nayak.git"
REPO_DIR = "Nayak"
FRONTEND_DIR_NAME = "jarvis-frontend"
BACKEND_DIR_NAME = "jarvis-backend"
# The Python backend server to run for the web UI.
BACKEND_SCRIPT_NAME = "api_server.py"

def run_command(command, cwd, name="Process"):
    """Runs a command in a subprocess and streams its output."""
    print(f"[{name}] Running command: {' '.join(command)}")
    # On Windows, 'npm' and other shell commands often need shell=True
    use_shell = platform.system() == "Windows"
    process = subprocess.Popen(
        command,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        shell=use_shell,
        bufsize=1
    )

    for line in iter(process.stdout.readline, ''):
        print(f"[{name}] {line.strip()}")

    process.wait()
    if process.returncode != 0:
        print(f"[{name}] Error: Command failed with exit code {process.returncode}")
        # In a real-world script, you might want to exit or handle this error
    return process.returncode


def main():
    """Main function to orchestrate the setup and run process."""
    # 1. Clone repository
    if not os.path.isdir(REPO_DIR):
        print(f"--- Cloning repository: {REPO_URL} ---")
        subprocess.run(["git", "clone", REPO_URL], check=True)
    else:
        print(f"--- Repository '{REPO_DIR}' already exists. Skipping clone. ---")

    # Define paths to backend and frontend directories
    base_path = os.path.abspath(REPO_DIR)
    backend_path = os.path.join(base_path, BACKEND_DIR_NAME)
    frontend_path = os.path.join(base_path, FRONTEND_DIR_NAME)
    venv_path = os.path.join(backend_path, "venv")

    # 2. Setup Python Backend
    if os.path.isdir(backend_path):
        print("\n--- Setting up Python backend ---")
        if not os.path.isdir(venv_path):
            print("Creating Python virtual environment...")
            subprocess.run([sys.executable, "-m", "venv", venv_path], cwd=backend_path, check=True)
        else:
            print("Virtual environment already exists.")

        if platform.system() == "Windows":
            python_exe = os.path.join(venv_path, "Scripts", "python.exe")
        else:
            python_exe = os.path.join(venv_path, "bin", "python")

        print("Installing backend dependencies from requirements.txt...")
        subprocess.run(
            [python_exe, "-m", "pip", "install", "-r", "requirements.txt"],
            cwd=backend_path,
            check=True
        )

    # 3. Setup Frontend
    if os.path.isdir(frontend_path):
        print("\n--- Setting up Node.js frontend ---")
        print("Installing frontend dependencies with 'npm install'...")
        use_shell = platform.system() == "Windows"
        # Using shell=True for npm on Windows
        subprocess.run("npm install", cwd=frontend_path, check=True, shell=use_shell)
    else:
        print(f"\n--- Skipping frontend setup: Directory '{FRONTEND_DIR_NAME}' not found. ---")

    # 4. Run Backend and Frontend Concurrently
    print("\n--- Starting backend and frontend servers ---")

    backend_thread = threading.Thread(
        target=run_command,
        args=([python_exe, BACKEND_SCRIPT_NAME], backend_path, "Backend"),
        daemon=True
    )

    frontend_thread = None
    if os.path.isdir(frontend_path):
        frontend_thread = threading.Thread(
            target=run_command,
            args=(["npm", "run", "dev"], frontend_path, "Frontend"),
            daemon=True
        )

    backend_thread.start()
    if frontend_thread:
        frontend_thread.start()

    print("\n--- Servers are running. Press Ctrl+C to stop. ---")
    try:
        # Keep the main thread alive to listen for Ctrl+C
        while True:
            # Threads are daemons, so they will exit when the main thread exits.
            # We can just wait here.
            if not backend_thread.is_alive():
                print("[!] Backend server has stopped.")
                break
            if frontend_thread and not frontend_thread.is_alive():
                print("[!] Frontend server has stopped.")
                break
            # Sleep to avoid busy-waiting
            threading.Event().wait(1)

    except KeyboardInterrupt:
        print("\n--- Shutting down servers... ---")
        # The daemon threads will be terminated automatically when the main script exits.


if __name__ == "__main__":
    main()
