import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const BASE_URL = "http://localhost:8000";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setUsers(res.data))
    .catch(err => console.error("Failed to fetch users", err));
  }, [token]);

  const fetchChats = (userId) => {
    setSelectedUserId(userId);
    setSelectedChatId(null);
    setMessages([]);
    axios.get(`${BASE_URL}/admin/users/${userId}/chats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setChats(res.data))
    .catch(err => console.error("Failed to fetch chats", err));
  };

  const fetchMessages = (chatId) => {
    setSelectedChatId(chatId);
    axios.get(`${BASE_URL}/admin/chats/${chatId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setMessages(res.data))
    .catch(err => console.error("Failed to fetch messages", err));
  };

  const handleDelete = (msgId) => {
    axios.delete(`${BASE_URL}/admin/messages/${msgId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(() => {
      setMessages(messages.filter(m => m.id !== msgId));
    })
    .catch(err => console.error("Failed to delete", err));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 p-6">
      <h1 className="text-4xl font-extrabold mb-6 text-center text-indigo-800">🛠️ Admin Panel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* USERS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-4"
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-3">👥 Users</h2>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => fetchChats(user.id)}
                className="block w-full text-left p-2 rounded hover:bg-indigo-100 transition"
              >
                📧 {user.email}
              </button>
            ))}
          </div>
        </motion.div>

        {/* CHATS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-4"
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-3">💬 Chats</h2>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => fetchMessages(chat.id)}
                className="block w-full text-left p-2 rounded hover:bg-green-100 transition"
              >
                Chat #{chat.id}
              </button>
            ))}
          </div>
        </motion.div>

        {/* MESSAGES */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-4"
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-3">🗨️ Messages</h2>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                whileHover={{ scale: 1.02 }}
                className="border rounded p-3 bg-gray-50"
              >
                <p className="text-sm mb-1"><strong>User:</strong> {msg.content}</p>
                <p className="text-sm mb-2 text-gray-600"><strong>Bot:</strong> {msg.response}</p>
                <button
                  onClick={() => handleDelete(msg.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  ❌ Delete Message
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;
