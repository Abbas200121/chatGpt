import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getChats, createNewChat, getMessages, sendMessage } from "../services/api";
import jsPDF from "jspdf"; // ← NEW

const botName = "Chatbot";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [chatId, setChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const fetchChats = useCallback(async () => {
    try {
      const data = await getChats();
      if (data.chats.length > 0) {
        setChats(data.chats);
        setChatId(data.chats[0].id);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  }, []);

  const fetchMessages = useCallback(async (selectedChatId) => {
    try {
      const data = await getMessages(selectedChatId);
      const formattedMessages = data.map((msg) => [
        { text: msg.content, isUser: true },
        { text: msg.response, isUser: false },
      ]).flat();
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found! Redirecting to login...");
      navigate("/");
    } else {
      fetchChats();
    }
  }, [navigate, fetchChats]);

  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId);
    }
  }, [chatId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = async () => {
    try {
      const response = await createNewChat();
      const newChat = { id: response.chat_id };
      setChats((prevChats) => [...prevChats, newChat]);
      setChatId(newChat.id);
      setMessages([]);
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const handleSend = async () => {
    if (!userMessage.trim() || !chatId) return;
    setMessages((prev) => [...prev, { text: userMessage, isUser: true }]);
    setUserMessage("");

    try {
      const response = await sendMessage(chatId, userMessage);
      if (response) {
        setMessages((prev) => [...prev, { text: response.response, isUser: false }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [...prev, { text: `Error: ${error.message}`, isUser: false }]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // ✅ Export chat messages to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    let y = 10;

    messages.forEach((msg) => {
      const sender = msg.isUser ? "You" : botName;
      const line = `${sender}: ${msg.text}`;
      doc.text(line, 10, y);
      y += 10;

      if (y > 280) {
        doc.addPage();
        y = 10;
      }
    });

    doc.save(`chat-${chatId || "export"}.pdf`);
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 
      ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>

      <div className={`max-w-3xl w-full p-6 rounded-lg shadow-lg relative 
        ${darkMode ? "bg-gray-800" : "bg-white"}`}>

        <h2 className="text-center text-2xl font-bold mb-4">Chat with {botName}</h2>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`absolute top-4 left-4 p-2 rounded-lg 
            ${darkMode ? "bg-gray-200 text-black" : "bg-gray-800 text-white"}`}
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>

        {/* Logout */}
        <button onClick={handleLogout} className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-lg">
          Logout
        </button>

        {/* Export PDF */}
        <button
          onClick={handleExportPDF}
          className="absolute top-4 right-24 p-2 bg-yellow-500 text-black rounded-lg"
        >
          Export PDF
        </button>

        {/* Chat Selection */}
        <div className="flex flex-wrap gap-2 mb-4 mt-8">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                setChatId(chat.id);
                fetchMessages(chat.id);
              }}
              className={`p-2 rounded-lg ${chat.id === chatId ? "bg-blue-500 text-white" : "bg-gray-600 text-white"}`}
            >
              Chat {chat.id}
            </button>
          ))}
          <button onClick={handleNewChat} className="p-2 bg-green-500 rounded-lg text-white">
            New Chat
          </button>
        </div>

        {/* Chat Messages */}
        <div className={`h-96 overflow-y-auto p-4 space-y-4 rounded-lg 
          ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: msg.isUser ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`p-3 rounded-lg max-w-xs ${msg.isUser ? "bg-blue-500 text-white ml-auto" : "bg-gray-600 text-white"}`}
            >
              <strong>{msg.isUser ? "You" : botName}:</strong> {msg.text}
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center mt-4">
          <input
            type="text"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className={`flex-1 p-3 rounded-lg outline-none 
              ${darkMode ? "bg-gray-700 text-white" : "bg-white text-black"}`}
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
