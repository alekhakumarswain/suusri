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

    // Initialize WebSocket connection
    useEffect(() => {
        const newSocket = io('https://suusrifchat.onrender.com', {
            transports: ['websocket'],
            reconnection: true
        });

        newSocket.on('connect', () => {
            console.log('✅ Connected to SuuSri Voice');
            setIsConnected(true);
            setError(null);
            newSocket.emit('start_voice_session', {});
        });

        newSocket.on('status', (data) => {
            console.log('System Status:', data.msg);
        });

        newSocket.on('session_started', (data) => {
            console.log('🎙️ Voice session started:', data.status);
        });

        newSocket.on('transcript', (data) => {
            console.log('📝 Transcript:', data);
            setMessages(prev => [...prev, {
                sender: data.sender?.toLowerCase() === 'user' ? 'user' : 'suusri',
                text: data.text
            }]);
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

                // Convert base64 to Float32 PCM
                const audioData = atob(data.audio);
                const bufferLength = audioData.length;
                const arrayBuffer = new ArrayBuffer(bufferLength);
                const view = new Uint8Array(arrayBuffer);
                for (let i = 0; i < bufferLength; i++) {
                    view[i] = audioData.charCodeAt(i);
                }

                const numSamples = bufferLength / 2;
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

                if (!window.nextStartTime || window.nextStartTime < audioCtx.currentTime) {
                    window.nextStartTime = audioCtx.currentTime;
                }
                source.start(window.nextStartTime);
                window.nextStartTime += audioBuffer.duration;

            } catch (error) {
                console.error('Error playing audio:', error);
            }
        });

        newSocket.on('interrupted', () => {
            console.log('⚠️ Generation interrupted');
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
                newSocket.on('end_voice_session');
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
        }
    };

    const processorRef = useRef(null);
    const micStreamRef = useRef(null);
    const isListeningRef = useRef(false);

    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = stream;

            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const audioCtx = audioContextRef.current;
            if (audioCtx.state === 'suspended') await audioCtx.resume();

            const source = audioCtx.createMediaStreamSource(stream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            source.connect(processor);
            processor.connect(audioCtx.destination);

            processor.onaudioprocess = (e) => {
                if (!isListeningRef.current) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const inputSampleRate = audioCtx.sampleRate;
                const outputSampleRate = 16000;
                const compression = inputSampleRate / outputSampleRate;
                const length = Math.floor(inputData.length / compression);
                const result = new Int16Array(length);

                for (let i = 0; i < length; i++) {
                    let sample = inputData[Math.floor(i * compression)];
                    sample = Math.max(-1, Math.min(1, sample));
                    result[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                }

                const binary = String.fromCharCode.apply(null, new Uint8Array(result.buffer));
                const base64Audio = btoa(binary);

                if (socket && isConnected) {
                    socket.emit('stream_audio', {
                        audio: base64Audio,
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
            socket.disconnect();
        }
        navigate('/');
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

            {/* Glowing Orb */}
            <div className="orb-container">
                <motion.div
                    className={`glowing-orb ${isListening ? 'active' : ''}`}
                    animate={isListening ? {
                        scale: [1, 1.1, 1],
                        opacity: [0.8, 1, 0.8]
                    } : {}}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <div className="orb-inner"></div>
                    <div className="orb-glow"></div>
                </motion.div>
            </div>

            {/* Chat Messages */}
            <div className="messages-container">
                <AnimatePresence>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            className={`message-wrapper ${msg.sender === 'user' ? 'user-message' : 'suusri-message'}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.2 }}
                        >
                            <div className="message-label">
                                {msg.sender === 'user' ? 'You' : 'SuuSri AI'}
                            </div>
                            <div className="talk-messages">
                                <div className={`talk-message ${msg.sender.toLowerCase()}`}>
                                    <span className="talk-sender">{msg.sender.toLowerCase() === 'user' ? 'You' : 'SuuSri'}:</span>
                                    <span className="talk-text">{msg.text}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Control Buttons */}
            <div className="control-buttons">
                <motion.button
                    className="mic-button"
                    onClick={handleMicClick}
                    whileTap={{ scale: 0.9 }}
                    disabled={!isConnected}
                    style={{ opacity: isConnected ? 1 : 0.5 }}
                >
                    <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
                </motion.button>

                <motion.button
                    className="end-call-button"
                    onClick={handleEndCall}
                    whileTap={{ scale: 0.9 }}
                >
                    <i className="fas fa-phone"></i>
                </motion.button>
            </div>

            {/* Text Input for Testing */}
            <div className="text-input-container">
                <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                    placeholder="Type to test (for debugging)..."
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
        </div>
    );
};

export default Talk;
