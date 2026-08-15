
import webbrowser
import pywhatkit
import time
from news import get_top_news
from Speak import speak
from AI import ask_ai
from AI import new_chat
from Weather import weather_command


def processCommand(command):
    print(command)
    if any(word in command.lower() for word in ["new chat","clear memory","forget conversation","reset chat"]):
        new_chat()
        speak("Conversation cleared.")
        return "Conversation cleared."

    elif "open google" in command.lower():
        webbrowser.open("https://www.google.com")
        return "Opening Google."

    elif "play" in command.lower():
        pywhatkit.playonyt(command)
        return f"Playing on YouTube: {command}"

    elif "news" in command.lower():
        headlines = get_top_news()

        if not headlines:
            speak("Sorry, I was unable to fetch the news at the moment.")
            return "Sorry, I was unable to fetch the news at the moment."

        speak("Here are today's top headlines.")
        print("Here are today's top headlines.")
        lines = ["Here are today's top headlines."]

        for i, headline in enumerate(headlines[:5], start=1):
            headline = headline.replace("- BBC News", "").strip()
            print(f"{i}. {headline}")
            speak(f"Headline {i}")
            speak(headline)
            lines.append(f"{i}. {headline}")
            time.sleep(0.3)

        speak("That's all for today's news.")
        print("That's all for today's news.")
        return "\n".join(lines)

    elif "search" in command.lower() or ".com" in command.lower():
        webbrowser.open(f"https://www.google.com/search?q={command.lower()}")
        return f"Searching for {command}."

    elif "weather" in command.lower() or "temperature" in command.lower():
        return weather_command(command)

    else:
        if "in detail" not in command.lower():
            prompt = f"{command} (Please provide a concise, short summary response.)"
        else:
            prompt = command

        response = ask_ai(prompt)
        print(response)
        speak(response)
        return response
            

    