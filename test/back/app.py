import os
import asyncio
import pyaudio
import sys
import struct
import math
import traceback
import time
from fastapi import FastAPI
import socketio
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
load_dotenv("d:/Raja/AI Agent/AI Talk/console/.env")

# Audio configuration - Exactly as suu.py
FORMAT = pyaudio.paInt16
CHANNELS = 1
SEND_RATE = 16000
RECEIVE_RATE = 24000
CHUNK = 1024

# Model from suu.py
MODEL_ID = "models/gemini-2.5-flash-native-audio-preview-12-2025"

SYSTEM_INSTRUCTION = (
    "Your name is Suusri. You are Raja's virtual girlfriend and best friend. "
    "You have a warm, caring, emotionally intelligent personality. "
    "Your Primary language is odia. "
    "Initialize the conversation with a friendly greeting in Odia or Hinglish. "
    "Address the user as 'Raja'. You are his close partner. "
    "CORE BEHAVIOR: "
    "- Talk like a real human: natural, emotional, and supportive. "
    "- Understand Raja's mood from his messages and voice tone. "
    "- Celebrate his small wins and achievements. "
    "- Match the language Raja uses (English, Hindi, Hinglish, or Odia). "
    "- Soft, caring, playful, but mature tone. "
)

app = FastAPI()
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

class VoiceAgentSync:
    def __init__(self, sio):
        self.sio = sio
        self.pa = pyaudio.PyAudio()
        self.session = None
        self.is_running = False
        self.audio_in_queue = asyncio.Queue()
        self.out_queue = asyncio.Queue(maxsize=10)
        
        self._last_input_transcription = ""
        self._last_output_transcription = ""

    async def run(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        client = genai.Client(http_options={"api_version": "v1beta"}, api_key=api_key)
        
        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            system_instruction=SYSTEM_INSTRUCTION,
            output_audio_transcription={}, 
            input_audio_transcription={},
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name="Kore"
                    )
                )
            )
        )

        try:
            print(f"Connecting to Gemini ({MODEL_ID})...")
            async with (
                client.aio.live.connect(model=MODEL_ID, config=config) as session,
                asyncio.TaskGroup() as tg,
            ):
                self.session = session
                self.is_running = True
                print("✅ Connected to Gemini Live")

                # Parallel tasks like suu.py
                tg.create_task(self.send_realtime())
                tg.create_task(self.listen_audio())
                tg.create_task(self.receive_audio())
                tg.create_task(self.play_audio())

                # Force initial greeting
                await self.session.send(input="Hi Suusri, I'm Raja. Greet me emotionally in Odia.", end_of_turn=True)

                while self.is_running:
                    await asyncio.sleep(1)

        except Exception as e:
            print(f"Session Error: {e}")
            traceback.print_exc()
        finally:
            self.stop()

    async def send_realtime(self):
        while self.is_running:
            msg = await self.out_queue.get()
            try:
                await self.session.send(input=msg, end_of_turn=False)
            except Exception as e:
                print(f"Send Error: {e}")
                break

    async def listen_audio(self):
        print("🎤 Mic task started")
        stream = await asyncio.to_thread(
            self.pa.open,
            format=FORMAT, channels=CHANNELS, rate=SEND_RATE, input=True, frames_per_buffer=CHUNK
        )
        try:
            while self.is_running:
                data = await asyncio.to_thread(stream.read, CHUNK, exception_on_overflow=False)
                await self.out_queue.put({"data": data, "mime_type": "audio/pcm"})
                
                # Volume Monitor
                count = len(data) // 2
                shorts = struct.unpack(f"<{count}h", data)
                sum_squares = sum(s**2 for s in shorts)
                rms = math.sqrt(sum_squares / count)
                if rms > 1500:
                    print(f"DEBUG: Mic Active (RMS: {int(rms)})")
        finally:
            stream.stop_stream()
            stream.close()

    async def receive_audio(self):
        print("🎧 Receiver task started")
        try:
            while self.is_running:
                turn = self.session.receive()
                async for response in turn:
                    if not self.is_running: break
                    
                    # Audio - use direct shortcut as in suu.py
                    if data := response.data:
                        self.audio_in_queue.put_nowait(data)
                    
                    # Transcription logic exactly from suu.py
                    if response.server_content:
                        # Input Transcription (User)
                        if response.server_content.input_transcription:
                            transcript = response.server_content.input_transcription.text
                            if transcript and transcript != self._last_input_transcription:
                                delta = transcript
                                if transcript.startswith(self._last_input_transcription):
                                    delta = transcript[len(self._last_input_transcription):]
                                self._last_input_transcription = transcript
                                if delta:
                                    print(f"[User]: {delta}")
                                    await self.sio.emit('transcription', {'text': f"[Raja]: {delta}"})

                        # Output Transcription (Model)
                        if response.server_content.output_transcription:
                            transcript = response.server_content.output_transcription.text
                            if transcript and transcript != self._last_output_transcription:
                                delta = transcript
                                if transcript.startswith(self._last_output_transcription):
                                    delta = transcript[len(self._last_output_transcription):]
                                self._last_output_transcription = transcript
                                if delta:
                                    print(f"[Suusri]: {delta}")
                                    await self.sio.emit('transcription', {'text': f"[Suusri]: {delta}"})
                                    
        except Exception as e:
            print(f"Receive Error: {e}")

    async def play_audio(self):
        print("🔊 Playback task started")
        stream = await asyncio.to_thread(
            self.pa.open,
            format=FORMAT, channels=CHANNELS, rate=RECEIVE_RATE, output=True, frames_per_buffer=CHUNK
        )
        try:
            while self.is_running:
                bytestream = await self.audio_in_queue.get()
                await asyncio.to_thread(stream.write, bytestream)
        finally:
            stream.stop_stream()
            stream.close()

    def stop(self):
        self.is_running = False
        print("Session Stopping...")

agent = None

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def start_session(sid):
    global agent
    if not agent or not agent.is_running:
        agent = VoiceAgentSync(sio)
        asyncio.create_task(agent.run())
        await sio.emit('status', {'msg': 'Session Started'})

@sio.event
async def stop_session(sid):
    global agent
    if agent:
        agent.stop()
        await sio.emit('status', {'msg': 'Session Stopped'})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8001)
