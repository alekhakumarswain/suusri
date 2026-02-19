import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './Talk.css';

const Talk = () => {
    const [isListening, setIsListening] = useState(false);
    const [messages, setMessages] = useState([
        {
            sender: 'suusri',
            text: "Heya! I'm SuuSri. Tap the mic to start talking, or type below to test! 😊"
        }
    ]);
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [textInput, setTextInput] = useState('');

    const navigate = useNavigate();
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const audioChunksRef = useRef([]);
    const activeSourcesRef = useRef([]);
    const nextStartTimeRef = useRef(0);
    const [isCallActive, setIsCallActive] = useState(false);

      const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:5000'
        : 'https://suusrifchat.onrender.com';

    // Initialize WebSocket connection
    useEffect(() => {
        const newSocket = io(apiUrl, {
            transports: ['polling', 'websocket'],
            reconnection: true
        });

        newSocket.on('connect', () => {
            console.log('✅ Connected to SuuSri Voice');
            setIsConnected(true);
            setError(null);
            // Don't auto-start session anymore
        });

        newSocket.on('status', (data) => {
            console.log('System Status:', data.msg);
        });

        newSocket.on('session_started', (data) => {
            console.log('🎙️ Voice session started:', data.status);
        });

        newSocket.on('transcript', (data) => {
            console.log('📝 Transcript:', data);
            const sender = data.sender?.toLowerCase() === 'user' ? 'user' : 'suusri';
            
            setMessages(prev => {
                if (prev.length > 0 && prev[prev.length - 1].sender === sender) {
                    const lastMsg = prev[prev.length - 1];
                    // Append text if it's not already at the end of the last message
                    // (Some streamings might repeat words, but usually chunks are additive)
                    const updatedMessages = [...prev];
                    updatedMessages[updatedMessages.length - 1] = {
                        ...lastMsg,
                        text: lastMsg.text.endsWith(data.text) ? lastMsg.text : lastMsg.text + data.text
                    };
                    return updatedMessages;
                }
                return [...prev, { sender, text: data.text }];
            });
        });

        newSocket.on('audio_response', async (data) => {
            try {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
                        sampleRate: 24000,
                    });
                }
                const audioCtx = audioContextRef.current;
                if (audioCtx.state === 'suspended') {
                    await audioCtx.resume();
                }

                // Handle both binary and base64 for backward compatibility
                let arrayBuffer;
                if (data.audio instanceof ArrayBuffer) {
                    arrayBuffer = data.audio;
                } else if (typeof data.audio === 'string') {
                    const audioData = atob(data.audio);
                    const bufferLength = audioData.length;
                    arrayBuffer = new ArrayBuffer(bufferLength);
                    const view = new Uint8Array(arrayBuffer);
                    for (let i = 0; i < bufferLength; i++) {
                        view[i] = audioData.charCodeAt(i);
                    }
                } else if (data.audio instanceof Blob) {
                    arrayBuffer = await data.audio.arrayBuffer();
                } else {
                    console.error('Unknown audio data format');
                    return;
                }

                if (!arrayBuffer || arrayBuffer.byteLength === 0) return;
                const numSamples = arrayBuffer.byteLength / 2;
                const audioBuffer = audioCtx.createBuffer(1, numSamples, 24000);
                const channelData = audioBuffer.getChannelData(0);
                const dataView = new DataView(arrayBuffer);

                for (let i = 0; i < numSamples; i++) {
                    const sample = dataView.getInt16(i * 2, true);
                    channelData[i] = sample < 0 ? sample / 32768 : sample / 32767;
                }

                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioCtx.destination);

                // Track source for potential barge-in interruption
                activeSourcesRef.current.push(source);
                source.onended = () => {
                    activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
                };

                if (!nextStartTimeRef.current || nextStartTimeRef.current < audioCtx.currentTime) {
                    nextStartTimeRef.current = audioCtx.currentTime;
                }
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;

            } catch (error) {
                console.error('Error playing audio:', error);
            }
        });

        newSocket.on('interrupted', () => {
            console.log('⚠️ Generation interrupted from server');
            stopAllAudio();
        });

        newSocket.on('error', (data) => {
            console.error('❌ Error:', data.message);
            setError(data.message);
        });

        newSocket.on('disconnect', () => {
            console.log('🔴 Disconnected from server');
            setIsConnected(false);
            setIsListening(false);
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, []);

    // Send text message for testing
    const handleSendText = () => {
        if (textInput.trim() && socket && isConnected) {
            // Add user message to UI
            setMessages(prev => [...prev, {
                sender: 'user',
                text: textInput
            }]);

            // Send to server
            socket.emit('send_text', { text: textInput });
            setTextInput('');

            // Add a temporary "thinking" indicator
            setMessages(prev => [...prev, {
                sender: 'suusri',
                text: "..."
            }]);

            // Remove the dots after the delay to make room for actual response
            setTimeout(() => {
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg && lastMsg.text === "...") {
                        return prev.slice(0, -1);
                    }
                    return prev;
                });
            }, 1200);
        }
    };

    const processorRef = useRef(null);
    const micStreamRef = useRef(null);
    const isListeningRef = useRef(false);

    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    const stopAllAudio = () => {
        if (activeSourcesRef.current.length > 0) {
            console.log("🛑 Stopping all audio playback (Barge-in)");
            activeSourcesRef.current.forEach(source => {
                try { source.stop(); } catch (e) {}
            });
            activeSourcesRef.current = [];
        }
        nextStartTimeRef.current = 0;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            micStreamRef.current = stream;

            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const audioCtx = audioContextRef.current;
            if (audioCtx.state === 'suspended') await audioCtx.resume();

            const source = audioCtx.createMediaStreamSource(stream);
            // Reduced buffer size for lower latency (2048 instead of 4096)
            const processor = audioCtx.createScriptProcessor(2048, 1, 1);
            processorRef.current = processor;

            source.connect(processor);
            processor.connect(audioCtx.destination);

            processor.onaudioprocess = (e) => {
                if (!isListeningRef.current) return;
                const inputData = e.inputBuffer.getChannelData(0);

                // Simple VAD: Calculate energy for barge-in
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);

                // If user starts speaking (energy threshold), stop AI audio
                if (rms > 0.1) { // Increased sensitivity threshold to avoid false barge-in
                    if (activeSourcesRef.current.length > 0 || (nextStartTimeRef.current > audioCtx.currentTime)) {
                        stopAllAudio();
                    }
                }

                const inputSampleRate = audioCtx.sampleRate;
                const outputSampleRate = 16000;
                const ratio = inputSampleRate / outputSampleRate;
                const length = Math.floor(inputData.length / ratio);
                const result = new Int16Array(length);

                // Faster resampling loop
                for (let i = 0; i < length; i++) {
                    let idx = Math.round(i * ratio);
                    let sample = inputData[idx];
                    if (sample > 1) sample = 1;
                    if (sample < -1) sample = -1;
                    result[i] = sample < 0 ? sample * 32768 : sample * 32767;
                }

                if (socket && isConnected) {
                    // Send as binary buffer directly to reduce base64 overhead
                    socket.emit('stream_audio', {
                        audio: result.buffer,
                        mime_type: 'audio/pcm;rate=16000'
                    });
                }
            };
            setIsListening(true);
        } catch (err) {
            console.error('Mic Error:', err);
            setError('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(track => track.stop());
            micStreamRef.current = null;
        }
        setIsListening(false);
    };

    // UI helper for Mic button (just toggles visual/hardware session if user wants)
    const handleMicClick = () => {
        if (!isConnected) return;

        if (isListening) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleEndCall = () => {
        if (socket) {
            socket.emit('end_voice_session');
            stopRecording();
        }
        setIsCallActive(false);
        setMessages([
            {
                sender: 'suusri',
                text: "Heya! I'm SuuSri. Tap the mic to start talking, or type below to test! 😊"
            }
        ]);
    };

    const handleStartCall = () => {
        if (socket && isConnected) {
            socket.emit('start_voice_session', {});
            setIsCallActive(true);
            // Auto start recording when call starts for a smooth experience
            startRecording();
        } else {
            setError("Still connecting to server... Please wait.");
        }
    };

    return (
        <div className="talk-wrapper">
            {/* Background Blobs */}
            <div className="blob-container">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            {/* Particles */}
            <div className="particles">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="particle" style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${5 + Math.random() * 10}s`
                    }}></div>
                ))}
            </div>

            {/* Back Button */}
            <button className="back-arrow" onClick={() => navigate('/')}>
                <i className="fas fa-arrow-left"></i>
            </button>

            {/* Title */}
            <div className="talk-title">
                <h2>SuuSri Voice</h2>
                {!isConnected && <p style={{ fontSize: '0.8rem', color: '#ff6b6b' }}>Connecting...</p>}
                {error && <p style={{ fontSize: '0.8rem', color: '#ff6b6b' }}>{error}</p>}
            </div>

            {/* Main Content Area */}
            <div className="talk-content">
                {/* Glowing Orb - Always visible to keep screen active */}
                <div className="orb-container">
                    <motion.div
                        className={`glowing-orb ${isListening ? 'active' : ''}`}
                        animate={isListening ? {
                            scale: [1, 1.1, 1],
                            opacity: [0.8, 1, 0.8]
                        } : {
                            scale: [1, 1.05, 1],
                            opacity: [0.6, 0.8, 0.6]
                        }}
                        transition={{
                            duration: isListening ? 2 : 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <div className="orb-inner"></div>
                        <div className="orb-glow"></div>
                    </motion.div>
                </div>

                {/* Messages Area */}
                <div className="messages-container">
                    <AnimatePresence>
                        {isCallActive ? (
                            messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    className={`message-wrapper ${msg.sender === 'user' ? 'user-message' : 'suusri-message'}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="message-label">
                                        {msg.sender === 'user' ? 'You' : 'SuuSri AI'}
                                    </div>
                                    <div className="message-bubble">
                                        <span className="talk-text">{msg.text}</span>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div 
                                className="call-hint"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <p>Tap below to start your conversation</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Unified Control Section at the Bottom */}
                <div className="control-section">
                    {!isCallActive ? (
                        <motion.button
                            className="start-call-button-round"
                            onClick={handleStartCall}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            <i className="fas fa-phone"></i>
                        </motion.button>
                    ) : (
                        <div className="control-buttons">
                            <motion.button
                                className={`mic-button ${!isListening ? 'muted' : ''}`}
                                onClick={handleMicClick}
                                whileTap={{ scale: 0.9 }}
                                disabled={!isConnected}
                            >
                                <i className={`fas ${isListening ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
                            </motion.button>

                            <motion.button
                                className="end-call-button"
                                onClick={handleEndCall}
                                whileTap={{ scale: 0.9 }}
                            >
                                <i className="fas fa-phone-slash"></i>
                            </motion.button>
                        </div>
                    )}
                </div>

                {/* Text Input (Only show during active call) */}
                {isCallActive && (
                    <div className="text-input-container">
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                            placeholder="Type a message..."
                            disabled={!isConnected}
                            className="text-input"
                        />
                        <button
                            onClick={handleSendText}
                            disabled={!isConnected || !textInput.trim()}
                            className="send-button"
                        >
                            <i className="fas fa-paper-plane"></i>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Talk;
