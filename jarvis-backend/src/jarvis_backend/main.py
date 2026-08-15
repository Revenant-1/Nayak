from ProcessCommands import processCommand
from Speak import speak
from TextCommands import open_text_terminal
from TextCommands import terminate_terminal
import speech_recognition as sr
import requests
import time





r = sr.Recognizer()
    
    
    
if __name__ == "__main__":
    print("Warming Up.....")
    time.sleep(1)
    speak(". Initallizing Jarwis ........")
    open_text_terminal()
    running=True
    while running: 
        
        
        print("Recognizing ....")
        try:
            with sr.Microphone() as source:
                print("Listning .....  ")
                r.adjust_for_ambient_noise(source, duration=1)
                audio = r.listen(source, timeout=15, phrase_time_limit=5)
            
            word = r.recognize_google(audio, language="en-IN")
            
            if "jarvis" in word.lower():

                # Remove the wake word from the recognized text
                command = word.lower().replace("jarvis", "").strip()

                # User said: "Jarvis open google"
                if command:
                    print(f"Command: {command}")
                    processCommand(command)
                else:
                    speak("I'm listening.")
                    try:
                        with sr.Microphone() as source:
                            print("Listening for command...")

                            r.adjust_for_ambient_noise(source, duration=0.5)

                            audio = r.listen(source,timeout=10,phrase_time_limit=8)
                            command = r.recognize_google(audio,language="en-IN").lower()
                            print(command)

                            processCommand(command)
                    except sr.WaitTimeoutError:
                        speak("I didn't hear anything.")

                    except sr.UnknownValueError:
                        speak("Sorry, I couldn't understand.")
                
            elif "shutdown" in word.lower():

                speak("Terminating Terminals....")
                print("Terminating Terminals....")
                speak(" Shutting down")
                print("Shutting down......")
                terminate_terminal()
                running = False
                #delay of 2 sec before termination so that speak function can work properly
                time.sleep(2)
                
                
                
            else:
                print("Sleeping......")
                
                          
        except sr.WaitTimeoutError:
            print("No speech detected.")

        except sr.UnknownValueError:
            print("Sorry, I couldn't understand.")

        except sr.RequestError as e:
            print("Speech recognition service error:", e)
        
        except requests.exceptions.RequestException as e:
            print(f"Could not connect to the news service: {e}")
            speak("Sorry, I couldn't connect to the news service.")
            