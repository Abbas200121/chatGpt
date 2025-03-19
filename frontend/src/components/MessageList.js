import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getMessages } from "../services/api"; // ✅ Import API function

const MessageList = () => {
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [animatedMessages, setAnimatedMessages] = useState([]);

  // ✅ Load messages when the component mounts
  useEffect(() => {
    fetchPreviousMessages();
  }, []);

  // ✅ Auto-scroll when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [animatedMessages]);

  // ✅ Fetch and format messages
  const fetchPreviousMessages = async () => {
    try {
      const data = await getMessages();
      const formattedMessages = data.map((msg) => [
        { text: msg.content, isUser: true },
        { text: msg.response, isUser: false },
      ]).flat(); // Flatten for correct order

      setMessages(formattedMessages);
      setAnimatedMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  return (
    <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-800 rounded-lg w-full max-w-lg">
      {animatedMessages.map((msg, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: msg.isUser ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className={`p-3 rounded-lg max-w-xs ${
            msg.isUser ? "bg-blue-500 text-white ml-auto" : "bg-gray-700 text-white"
          }`}
        >
          <strong>{msg.isUser ? "You" : "AI"}:</strong> {msg.text}
        </motion.div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
