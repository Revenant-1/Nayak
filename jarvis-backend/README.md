# Jarvis - A Python Voice Assistant

A simple yet powerful voice assistant built in Python, inspired by Iron Man's J.A.R.V.I.S. This assistant can perform various tasks based on voice commands, leveraging Google's Speech Recognition, multiple AI models, and various APIs for a rich interactive experience.

## Features

- **Voice-activated:** Listens for the wake word "Jarvis" to start taking commands.
- **Dual-Mode Interaction:** Supports both voice commands and a separate text-based terminal for input.
- **Web Browsing:** Opens Google and performs web searches.
- **YouTube Integration:** Plays videos or music on YouTube.
- **News Headlines:** Fetches and reads the latest news headlines from BBC News.
- **Weather Forecasts:** Get the current weather and a brief forecast for any city.
- **Resilient AI-Powered Conversations:** Answers general questions using Google's Gemini AI, with an automatic fallback to Groq's Llama 3.1 model to ensure high availability.
- **Conversational Memory:** Remembers the context of the current conversation for natural follow-up questions.
- **Chat Reset:** Allows clearing the AI's memory to start a fresh conversation.
- **Secure API Key Handling:** Uses a `.env` file to securely store API keys.

## 🚀 Getting Started: A Beginner's Guide

Welcome! Follow these steps to get your own Jarvis voice assistant running on your computer.

### Step 1: Prerequisites (What you'll need)

Before you begin, make sure you have the following installed and ready:

1.  **Python (version 3.8 or newer):** Jarvis is a Python application. If you don't have it, you can download it from python.org.
2.  **Git:** This is a tool for downloading the project's code from GitHub. You can get it from git-scm.com.
3.  **A Microphone:** Jarvis needs to hear your commands!
4.  **API Keys:** These are like passwords that let your application access services from other companies.
    - **Google AI (Gemini) API Key:** For answering questions. Get one from Google AI Studio.
    - **WeatherAPI Key:** For weather forecasts. Get a free one from weatherapi.com.
    - **(Optional) Groq API Key:** For a faster AI backup. Get one from groq.com.

### Step 2: Get the Code

Open your terminal (or Command Prompt on Windows) and use Git to clone (download) the project files.

```bash
git clone https://github.com/Danish-khan-coder/Python-Jarwis.git
cd Python-Jarwis
```

### Step 3: Set Up the Environment

We'll create a "virtual environment" to keep the project's dependencies neat and separate from other Python projects on your system.

1.  **Create and activate the virtual environment:**
    ```bash
    # On macOS/Linux
    python3 -m venv .venv
    source .venv/bin/activate
    
    # On Windows
    python -m venv .venv
    .venv\Scripts\activate
    ```
    You'll know it's active when you see `(.venv)` at the beginning of your terminal prompt.

2.  **Install the required Python packages:**
    This command reads the `requirements.txt` file and installs all the necessary libraries for Jarvis to work.
    ```bash
    pip install -r requirements.txt
    ```
 
### Step 4: Add Your API Keys

Jarvis needs your secret API keys to function. We'll store them in a special `.env` file that is ignored by Git, so you don't accidentally share them.

1.  **Create the `.env` file:**
    Copy the example file to create your own local configuration file.
    ```bash
    cp .env.example .env
    ```
2.  **Edit the file:**
    Open the newly created `.env` file in a text editor and paste your API keys that you obtained in Step 1.
    ```dotenv
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    WEATHER_API_KEY="YOUR_WEATHER_API_KEY"
    GROQ_API_KEY="YOUR_GROQ_API_KEY" # Optional, for AI fallback
    ```

### Step 5: Run Jarvis!

Run the main script to start the assistant:

```bash
python main.py
```

The assistant will initialize and start listening for the wake word "Jarvis". Once it hears the wake word, it will listen for your command.

### Example Commands

- "Jarvis, what is the capital of France?"
- "Jarvis, open Google."
- "Jarvis, play a song by Queen."
- "Jarvis, tell me the latest news."
- "Jarvis, what's the weather in London?"
- "Jarvis, new chat."
- "Jarvis, shutdown."