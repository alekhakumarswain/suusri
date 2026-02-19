import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Chat.css';
import Navbar from '../Navbar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Helper component for typewriter effect
const TypewriterEffect = ({ text, speed = 10, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, speed, onComplete]);

  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedText}</ReactMarkdown>
    </div>
  );
};

const Chat = () => {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [userName, setUserName] = useState('Unknown');
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // Initialize session
  useEffect(() => {
    // Generates a fresh session ID every refresh
    const freshSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(freshSessionId);
    setMessages([{ text: "Hii! 👋 Mu tumara Suusri. Kan naama tumara?  😊", sender: 'ai', isTyped: true }]);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessageText = userInput;

    // Add user message to UI
    setMessages((prev) => [...prev, { text: userMessageText, sender: "user", isTyped: true }]);
    setUserInput('');
    setIsTyping(true);

    try {
      // Use local backend URL for faster testing/debugging if running locally
      const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:5000/chat'
        : 'https://suusrifchat.onrender.com/chat';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessageText,
          history: conversationHistory,
          session_id: sessionId,
          user_name: userName, // Send known name
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Network response was not ok');

      const aiText = data.response;
      setConversationHistory(data.history);

      // Update name if backend found it
      if (data.user_name && data.user_name !== 'Unknown') {
        setUserName(data.user_name);
      }

      // Add AI response as NOT typed yet
      setMessages((prev) => [...prev, { text: aiText, sender: "ai", isTyped: false }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: "Oops! Backend se connection toot gaya... 😅", sender: "ai", isTyped: true }
      ]);
      console.error("API Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const markMessageAsTyped = (index) => {
    setMessages(prev => prev.map((msg, i) => i === index ? { ...msg, isTyped: true } : msg));
  };

  return (
    <>
      <div className="chat-wrapper">
        <div className="chat-container">
          <div className="chat-header">
            <div className="avatar-circle">S</div>
            <div className="header-info" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <h3>SuuSri</h3>
              <div className="status-container">
                <span className="status-dot"></span>
                <span>Active now</span>
              </div>
            </div>
          </div>

          <div id="chatBox" className="chat-box">
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className={`message-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`}
                >
                  {msg.sender === 'ai' && <div className="message-avatar ai-avatar">S</div>}
                  <div className={`message-bubble ${msg.sender === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
                    {msg.sender === 'ai' && !msg.isTyped ? (
                      <TypewriterEffect
                        text={msg.text}
                        onComplete={() => markMessageAsTyped(index)}
                      />
                    ) : msg.sender === 'ai' ? (
                      <div className="markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="message-row ai-row"
                >
                  <div className="message-avatar ai-avatar">S</div>
                  <div className="message-bubble ai-bubble typing-bubble">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          <div className="input-area">
            <div className="input-wrapper">
              <input
                id="userInput"
                type="text"
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                autoComplete="off"
              />
              <button id="sendButton" onClick={sendMessage} disabled={!userInput.trim()}>
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;