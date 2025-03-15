import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; 
const botName = "Chatbot";


const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [typingMessage, setTypingMessage] = useState(""); // AI typing message state
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate(); // ✅ Hook for navigation

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/"); // Redirect to login if no token
    }
  }, [navigate]); // Runs once when component mounts

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingMessage]);

  const handleSend = async () => {
    if (!userMessage.trim()) return;

    const token = localStorage.getItem("token"); // Get token from local storage

    // ✅ Instantly add user message to the chat
    setMessages((prev) => [...prev, { text: userMessage, isUser: true }]);


    setUserMessage(""); // Clear input field
    try {
      setIsTyping(true);
      setTypingMessage("AI is typing...");

      const response = await fetch("http://localhost:8000/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ content: userMessage }),
      });

      if (response.status === 401) {
        throw new Error("Unauthorized: Please log in again.");
      }

      const data = await response.json();
      const aiResponse = data.response;

      setTimeout(() => {
        setIsTyping(false);
        simulateTyping(aiResponse);
      }, 300); // Reduced delay for faster response appearance
    } catch (error) {
      setMessages((prev) => [...prev, { text: `Error: ${error.message}`, isUser: false }]);
      setIsTyping(false);
    }
  };

  const simulateTyping = (text) => {
    let index = text.length;
    let currentText = "";

    const typingEffect = setInterval(() => {
      if (index === 0) {
        clearInterval(typingEffect);
        setMessages((prev) => [...prev, { text: currentText, isUser: false }]);
        setTypingMessage("");
      } else {
        currentText = text[index - 1] + currentText;
        setTypingMessage(currentText);
        index--;
      }
    }, 20); // Increased speed for even faster appearance without flashing
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-lg w-full bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-center text-2xl font-bold mb-4">Chat with {botName}</h2>
        <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-700 rounded-lg">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: msg.isUser ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`p-3 rounded-lg max-w-xs ${
                msg.isUser ? "bg-blue-500 text-white ml-auto" : "bg-gray-600 text-white"
              }`}
            >
              <strong>{msg.isUser ? "You" : botName}:</strong> {msg.text}
            </motion.div>
          ))}
          {/* ✅ AI is typing effect */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, repeat: Infinity }}
              className="p-3 bg-gray-600 text-white rounded-lg max-w-xs"
            >
              <strong>{botName}:</strong> {typingMessage}
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex items-center mt-4">
          <input
            type="text"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 p-3 text-white bg-gray-700 rounded-lg outline-none"
          />
          <button onClick={handleSend} className="ml-2 p-2 bg-blue-500 rounded-full text-white">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
