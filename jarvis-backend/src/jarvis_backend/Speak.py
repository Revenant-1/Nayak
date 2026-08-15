import pyttsx3
import time

def speak(text):
    try:
        engine = pyttsx3.init()
        engine.setProperty("rate", 170)

        engine.say(text)
        engine.runAndWait()
        time.sleep(2)
        
    except Exception as e:
        print("Speech Error:", e)
if __name__ =="__main__":
    speak("Hello Danish How are you")