import React, { useState } from "react";

const MessageForm = ({ onSend }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center p-4 bg-gray-800 rounded-lg w-full max-w-lg mt-4">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 p-3 text-white bg-gray-700 rounded-lg outline-none"
      />
      <button type="submit" className="ml-2 p-2 bg-blue-500 rounded-full text-white">
        Send
      </button>
    </form>
  );
};

export default MessageForm;
