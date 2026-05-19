import pyttsx3
import sounddevice as sd
import soundfile as sf
import whisper
import numpy as np
import tempfile
import os

# Load whisper model
print("Loading voice systems...")
whisper_model = whisper.load_model("base")

# Setup text to speech
engine = pyttsx3.init()
engine.setProperty('rate', 165)
engine.setProperty('volume', 1.0)

# Give it a cleaner voice if available
voices = engine.getProperty('voices')
for voice in voices:
    if 'david' in voice.name.lower() or 'mark' in voice.name.lower():
        engine.setProperty('voice', voice.id)
        break

def speak(text):
    """AI speaks text out loud"""
    print(f"\n🤖 Coach: {text}\n")
    engine.say(text)
    engine.runAndWait()

def listen(duration=15, silence_threshold=0.01):
    """Records your voice and converts to text"""
    sample_rate = 16000

    print(f"🎤 Listening for up to {duration} seconds... speak clearly.")
    recording = sd.rec(
        int(duration * sample_rate),
        samplerate=sample_rate,
        channels=1,
        dtype='float32'
    )
    sd.wait()
    print("✅ Processing your answer...")

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        temp_path = f.name

    sf.write(temp_path, recording, sample_rate)
    result = whisper_model.transcribe(temp_path, language="en")
    os.unlink(temp_path)

    text = result["text"].strip()
    print(f"🗣️  You said: {text}\n")