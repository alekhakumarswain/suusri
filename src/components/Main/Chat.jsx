import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './Chat.css';

import './Chat.css';
import Navbar from '../Navbar';

const Chat = () => {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([]);
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    // Append user message
    setMessages([...messages, { text: userInput, sender: "user" }]);

    setUserInput('');

    try {
      // Get AI response
      const result = await model.generateContent(userInput);
      const aiResponse = result.response.candidates[0].content.parts.map(part => part.text).join(" ");
      
      // Append AI message
      setMessages(prevMessages => [
        ...prevMessages,
        { text: aiResponse, sender: "ai" },
      ]);
    } catch (error) {
      setMessages(prevMessages => [
        ...prevMessages,
        { text: "Sorry, I couldn't process your request. Please try again later.", sender: "ai" },
      ]);
      console.error(error);
    }
  };

  return (
    <>
            <Navbar />

    <div className="chat-container">
      <div id="chatBox" className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="footer">
        <input 
          id="userInput" 
          type="text" 
          placeholder="Type your message..." 
          value={userInput} 
          onChange={(e) => setUserInput(e.target.value)} 
        />
        <button id="sendButton" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
    </>
  );
};

export default Chat;
