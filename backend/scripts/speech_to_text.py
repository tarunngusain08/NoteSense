# speech_to_text.py
import speech_recognition as sr
import sys

def transcribe_audio(audio_path):
    recognizer = sr.Recognizer()
    
    try:
        with sr.AudioFile(audio_path) as source:
            audio = recognizer.record(source)
        
        text = recognizer.recognize_google(audio)
        return text
    except sr.UnknownValueError:
        return "Could not understand audio"
    except sr.RequestError:
        return "Could not request results"
    except Exception as e:
        return f"Unexpected error: {e}"

if __name__ == "__main__":

    if len(sys.argv) < 2:
        print("Please provide an audio file path")
        sys.exit(1)
    
    audio_path = sys.argv[1]
    result = transcribe_audio(audio_path)
    print(result)