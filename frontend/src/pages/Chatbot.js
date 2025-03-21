import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getChats, createNewChat, getMessages, sendMessage } from "../services/api"; 

const botName = "Chatbot";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [chatId, setChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Fetch user chats
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

  // ✅ Fetch messages for selected chat
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

  // ✅ Load chats and check auth token
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No token found! Redirecting to login...");
      navigate("/");
    } else {
      fetchChats();
    }
  }, [navigate, fetchChats]);

  // ✅ Fetch messages when chat ID changes
  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId);
    }
  }, [chatId, fetchMessages]);

  // ✅ Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Create new chat
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

  // ✅ Send a message
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

  // ✅ Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-lg w-full bg-gray-800 p-6 rounded-lg shadow-lg relative">
        <h2 className="text-center text-2xl font-bold mb-4">Chat with {botName}</h2>

        <button onClick={handleLogout} className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-lg">
          Logout
        </button>

        {/* Chat Selection */}
        <div className="flex space-x-2 mb-4">
  {chats.map((chat) => (
    <button
      key={chat.id}
      onClick={() => {
        setChatId(chat.id);
        fetchMessages(chat.id);
      }}
      className={`p-2 rounded-lg ${chat.id === chatId ? "bg-blue-500 text-white" : "bg-gray-600"}`}
    >
      Chat {chat.number}  {/* ✅ Use sequential numbering */}
    </button>
  ))}
  <button onClick={handleNewChat} className="p-2 bg-green-500 rounded-lg text-white">
    New Chat
  </button>
</div>


        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-700 rounded-lg">
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

        {/* Message Input */}
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
