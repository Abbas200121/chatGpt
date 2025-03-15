import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const MessageList = ({ messages }) => {
  const messagesEndRef = useRef(null);
  const [animatedMessages, setAnimatedMessages] = useState([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    // If last message is from AI and has fullText, animate it
    if (!lastMessage.isUser && lastMessage.fullText) {
      let index = 0;
      const text = lastMessage.fullText;

      setAnimatedMessages((prev) => [...prev, { text: "", isUser: false }]);

      const typingInterval = setInterval(() => {
        setAnimatedMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            text: text.substring(0, index + 1),
            isUser: false,
          };
          return newMessages;
        });

        index++;
        if (index >= text.length) {
          clearInterval(typingInterval);
        }
      }, 50); // Adjust speed of typing animation
    } else {
      setAnimatedMessages(messages);
    }
  }, [messages]);

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
