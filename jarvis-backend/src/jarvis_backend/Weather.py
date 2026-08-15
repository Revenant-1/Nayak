import os
import re
import requests
from dotenv import load_dotenv
from Speak import speak

load_dotenv()

API_KEY = os.getenv("WEATHER_API_KEY")

DEFAULT_CITY = "Thane"

URL = "http://api.weatherapi.com/v1/forecast.json"


def extract_city(command):
    """
    Extract city from user command.
    Defaults to Thane if none is found.
    """

    command = command.lower()

    patterns = [
        r"weather in (.+)",
        r"weather of (.+)",
        r"temperature in (.+)",
        r"forecast in (.+)",
        r"forecast for (.+)",
        r"in (.+)"
    ]

    for pattern in patterns:
        match = re.search(pattern, command)

        if match:
            city = match.group(1)
            city = city.replace("?", "")
            city = city.replace(".", "")
            city = city.strip()

            return city.title()

    return DEFAULT_CITY


def weather_command(command):

    if not API_KEY:
        speak("Weather API key is missing.")
        print("Weather API key is missing.")
        return "Weather API key is missing."

    city = extract_city(command)

    params = {
        "key": API_KEY,
        "q": city,
        "days": 1,
        "aqi": "no",
        "alerts": "no"
    }

    try:

        response = requests.get(URL, params=params, timeout=10)
        data = response.json()

        if "error" in data:
            msg = f"Sorry, I couldn't find weather information for {city}."
            print(msg)
            speak(msg)
            return msg

        location = data["location"]
        current = data["current"]
        forecast = data["forecast"]["forecastday"][0]["day"]

        temperature = current["temp_c"]
        feels_like = current["feelslike_c"]
        condition = current["condition"]["text"]
        rain_chance = int(forecast["daily_chance_of_rain"])

        # Console Output
        print("\n========== WEATHER ==========")
        print(f"Location      : {location['name']}")
        print(f"Temperature   : {temperature}°C")
        print(f"Feels Like    : {feels_like}°C")
        print(f"Condition     : {condition}")
        print(f"Chance of Rain: {rain_chance}%")
        print("=============================\n")

        # Rain advice
        if rain_chance >= 70:
            rain_message = "There is a high chance of rain today. Carry an umbrella."

        elif rain_chance >= 40:
            rain_message = "There is a moderate chance of rain today."

        else:
            rain_message = "Rain is unlikely today."

        # Temperature advice
        if temperature >= 38:
            temp_message = "It is extremely hot outside. Stay hydrated."

        elif temperature <= 15:
            temp_message = "It is quite cold today. Consider wearing a jacket."

        else:
            temp_message = ""

        message = (
            f"The temperature in {location['name']} is "
            f"{temperature} degrees Celsius. "
            f"It feels like {feels_like} degrees. "
            f"The chance of rain today is {rain_chance} percent. "
            f"{rain_message} {temp_message}"
        )

        print(message)
        speak(message)
        return message

    except Exception as e:

        print(e)

        speak("Sorry, I couldn't fetch the weather right now.")
        return "Sorry, I couldn't fetch the weather right now."