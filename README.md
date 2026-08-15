# Jarvis 2.0 - AI Voice Assistant with a Web UI

Jarvis 2.0 is a comprehensive AI-powered voice assistant project, inspired by Iron Man's J.A.R.V.I.S., featuring both a robust Python backend for voice processing and AI interactions, and a modern web-based frontend for visual interaction and control.

## 🌟 Features

### Backend (Python)
- **Voice-activated:** Listens for the wake word "Jarvis" to start taking commands.
- **Dual-Mode Interaction:** Supports both voice commands and a separate text-based terminal for input.
- **Web Browsing:** Opens Google and performs web searches.
- **YouTube Integration:** Plays videos or music on YouTube.
- **News Headlines:** Fetches and reads the latest news headlines from BBC News.
- **Weather Forecasts:** Get the current weather and a brief forecast for any city.
- **Multi-Model AI Conversations:** Utilizes a sophisticated fallback system for AI responses. It prioritizes the local `GSMS-B/Indian-Legal-Llama-3.2-3B-GGUF` model for specialized legal queries, then falls back to other local and cloud-based models (like Gemini and Groq) for general questions, ensuring high availability and speed.
- **Conversational Memory:** Remembers the context of the current conversation for natural follow-up questions.
- **Chat Reset:** Allows clearing the AI's memory to start a fresh conversation.
- **Secure API Key Handling:** Uses a `.env` file to securely store API keys.

### Frontend (Web)
- **Modern Web Interface:** A clean and responsive UI to interact with Jarvis visually.
- **Real-time Conversation History:** Displays the ongoing conversation, including user prompts and Jarvis's replies.
- **In-browser Voice Recognition:** Listens for the "Jarvis" wake word and processes commands directly in the browser (Chrome/Edge recommended).
- **Text Input Fallback:** A text input field allows you to type commands, ensuring compatibility across all browsers.
- **Visual Feedback:** An animated orb provides visual feedback, glowing when Jarvis is listening.
- **Client-side Text-to-Speech:** Reads assistant responses aloud directly in the browser.
- **New Chat Control:** A button to easily clear the conversation history and start fresh.

## 🛠️ Technologies Used

*   **Backend:**
    *   Python
    *   Flask & Flask-CORS (for the web server)
    *   Google Generative AI (Gemini)
    *   Groq API (Llama 3.1)
    *   `llama-cpp-python` for local model inference
    *   `pyttsx3` (for voice synthesis)
    *   `SpeechRecognition`
*   **Frontend:**
    *   React
    *   Vite
    *   Tailwind CSS
    *   Framer Motion (for animations)

## 🚀 Getting Started

Follow these steps to get Jarvis 2.0 up and running on your local machine.

### Step 1: Prerequisites

Ensure you have the following installed:

1.  **Git:** For cloning the repository. Download from git-scm.com.
2.  **Python (3.8+):** For the backend. Download from python.org.
3.  **Node.js & npm (or Yarn):** For the frontend. Download from nodejs.org.
4.  **A Microphone:** Essential for voice commands.
5.  **API Keys:**
    *   **Google AI (Gemini) API Key:** For AI conversations. Get one from Google AI Studio.
    *   **WeatherAPI Key:** For weather forecasts. Get a free one from weatherapi.com.
    *   **(Optional) Groq API Key:** For a faster AI fallback. Get one from groq.com.

### Step 2: Clone the Repository

Open your terminal or command prompt and run:

```bash
git clone https://github.com/Danish-khan-coder/Jarvis-2.0.git # Use your actual repository URL
cd Jarvis-2.0
```

### Step 3: Backend Setup and Run

Navigate into the `jarvis-backend` directory to set up the Python voice assistant.

```bash
cd jarvis-backend
```

1.  **Create and activate a virtual environment:**
    ```bash
    # On macOS/Linux
    python3 -m venv .venv
    source .venv/bin/activate
    
    # On Windows
    python -m venv .venv
    .venv\Scripts\activate
    ```

2.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure API Keys:**
    Copy the example environment file and fill in your API keys.
    ```bash
    cp .env.example .env
    ```
    Open the `.env` file in a text editor and replace the placeholder values:
    ```dotenv
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    WEATHER_API_KEY="YOUR_WEATHER_API_KEY"
    GROQ_API_KEY="YOUR_GROQ_API_KEY" # Optional
    ```

4.  **Run the Backend:**
    ```bash
    python main.py
    ```
    The backend will initialize and start listening for the wake word "Jarvis".

### Step 4: Frontend Setup and Run

Open a **new terminal window** and navigate into the `jarvis-frontend` directory.

```bash
cd ../jarvis-frontend # If you are still in jarvis-backend
# Or if you opened a new terminal:
# cd Python-Jarwis/jarvis-frontend
```

1.  **Install Node.js dependencies:**
    ```bash
    npm install # Or yarn install
    ```

2.  **Run the Frontend Development Server:**
    ```bash
    npm run dev # Or yarn dev
    ```
    This will typically start a development server (e.g., on `http://localhost:5173`). Open this URL in your web browser.

## 🗣️ Example Commands (for the voice assistant)

- "Jarvis, what is the capital of France?"
- "Jarvis, open Google."
- "Jarvis, play a song by Queen."
- "Jarvis, tell me the latest news."
- "Jarvis, what's the weather in London?"
- "Jarvis, new chat."
- "Jarvis, shutdown."