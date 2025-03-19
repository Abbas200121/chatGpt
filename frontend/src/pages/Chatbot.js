import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getMessages, sendMessage } from "../services/api"; // ✅ Import API functions

const botName = "Chatbot";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [typingMessage, setTypingMessage] = useState(""); 
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Load messages when user logs in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/"); // Redirect if no token
    } else {
      fetchMessages(); // Load previous messages
    }
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingMessage]);

  // ✅ Fetch previous messages from backend
  const fetchMessages = async () => {
    try {
      const data = await getMessages();
      const formattedMessages = data.map((msg) => [
        { text: msg.content, isUser: true },
        { text: msg.response, isUser: false },
      ]).flat(); // Flatten to keep proper message order

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove the auth token
    navigate("/"); // Redirect to login page
  };
  
  const handleSend = async () => {
    if (!userMessage.trim()) return;
    setMessages((prev) => [...prev, { text: userMessage, isUser: true }]);
    setUserMessage(""); 

    try {
      setIsTyping(true);
      setTypingMessage("AI is typing...");

      const response = await sendMessage(userMessage);

      if (response) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { text: response.response, isUser: false },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: `Error: ${error.message}`, isUser: false },
      ]);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-lg w-full bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-center text-2xl font-bold mb-4">Chat with {botName}</h2>

                {/*Logout Button */}
                <button
          onClick={handleLogout}
          className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-lg"
        >
          Logout
        </button>


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
