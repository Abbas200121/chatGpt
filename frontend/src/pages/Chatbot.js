import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getChats, createNewChat, getMessages, sendMessage } from "../services/api";
import jsPDF from "jspdf";

const supportedLanguages = {
  en: "en-US",
  ar: "ar-EG",
  he: "he-IL"
};

const botVoices = {
  en: "Google US English",
  ar: "Google العربية",
  he: "Google עברית"
};
const botName = "Chatbot";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [chatId, setChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [generateImageMode, setGenerateImageMode] = useState(false);
  const messagesEndRef = useRef(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [typingBotMessage, setTypingBotMessage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
const recognitionRef = useRef(null);
const [language, setLanguage] = useState("en");  // 🌐 Language state
const [isLoading, setIsLoading] = useState(false); // ⏳ Bot thinking
const [suggestions, setSuggestions] = useState([]);
const [searchTerm, setSearchTerm] = useState("");


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
  if (!("webkitSpeechRecognition" in window)) return;

  const recognition = new window.webkitSpeechRecognition();
  recognition.lang = supportedLanguages[language];  // 🔄 Dynamic language
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setUserMessage(transcript);
  };

  recognition.onerror = () => setIsRecording(false);
  recognition.onend = () => setIsRecording(false);

  recognitionRef.current = recognition;
}, [language]); // Reactivate when language changes


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingBotMessage]);

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
  setTypingBotMessage(null);
  setIsLoading(true);
  setSuggestions([]); // ❌ Clear old suggestions

  try {
    let response;

    if (generateImageMode) {
      const res = await fetch(`http://localhost:8000/chats/${chatId}/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ prompt: userMessage }),
      });
      response = await res.json();
    } else {
      response = await sendMessage(chatId, userMessage);
    }

    if (response) {
      const isImage = generateImageMode;
      const botReply = isImage
        ? `<img src="${response.response}" alt="Generated" class="rounded-lg max-w-full" />`
        : response.response;

      // ✏️ Typing effect
      let displayed = "";
      const interval = setInterval(() => {
        displayed = botReply.slice(0, displayed.length + 1);
        setTypingBotMessage(displayed);

        if (displayed.length >= botReply.length) {
          clearInterval(interval);
          setTypingBotMessage(null);
          setMessages((prev) => [...prev, { text: botReply, isUser: false }]);
          setIsLoading(false);

          // 🔊 Speech synthesis (only for text)
          if (!isImage && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(botReply);
            const selectedVoice = speechSynthesis
              .getVoices()
              .find((v) => v.name === botVoices[language]);
            if (selectedVoice) utterance.voice = selectedVoice;
            utterance.lang = supportedLanguages[language];
            speechSynthesis.speak(utterance);
          }

          // 💡 Fetch AI suggestions (only for text)
          if (!isImage) {
            fetch(`http://localhost:8000/chats/${chatId}/suggestions`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            })
              .then((res) => res.json())
              .then((data) => setSuggestions(data.suggestions || []))
              .catch((err) => {
                console.error("❌ Error fetching suggestions:", err);
                setSuggestions([]);
              });
          }
        }
      }, 30);
    }
  } catch (error) {
    console.error("Error:", error);
    setMessages((prev) => [...prev, { text: `Error: ${error.message}`, isUser: false }]);
    setIsLoading(false);
    setSuggestions([]);
  }
};

const handleExportZip = async () => {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch("http://localhost:8000/chats/export-zip", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "chats.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Failed to export chats");
  }
};


  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    let y = 10;

    messages.forEach((msg) => {
      const sender = msg.isUser ? "You" : botName;
      const plainText = msg.text.replace(/<[^>]+>/g, ""); // strip HTML
      const line = `${sender}: ${plainText}`;
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
  <div className={`flex flex-col items-center justify-center min-h-screen px-4 py-6 transition ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
    <div className={`max-w-5xl w-full p-6 rounded-2xl shadow-2xl relative border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">💬 Chat with {botName}</h2>
<div className="flex justify-end gap-4 mb-4">
  <button
    onClick={handleExportPDF}
    className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium shadow transition duration-200"
  >
    📄 Export PDF
  </button>

  <button
    onClick={handleExportZip}
    className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-medium shadow transition duration-200"
  >
    📦 Export ZIP
  </button>

  <button
    onClick={handleLogout}
    className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold shadow transition duration-200"
  >
    🚪 Logout
  </button>
</div>

      </div>

      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded-lg shadow-sm">
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
          
          <button
            onClick={() => {
              const next = language === "en" ? "ar" : language === "ar" ? "he" : "en";
              setLanguage(next);
            }}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm"
          >
            🌐 {language.toUpperCase()}
          </button>
        </div>

        {/* Search bar */}
        <div className="w-full sm:w-auto flex-grow">
          <input
            type="text"
            placeholder="🔍 Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${darkMode ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-400" : "bg-white border-gray-300 focus:ring-blue-500"}`}
          />
        </div>
      </div>

      {/* Chat Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {chats.map((chat, index) => (
          <button key={chat.id} onClick={() => { setChatId(chat.id); fetchMessages(chat.id); }}
            className={`px-3 py-1 rounded-full font-medium transition ${chat.id === chatId ? "bg-blue-500 text-white" : "bg-gray-300 text-black hover:bg-gray-400"}`}>
            Chat {index + 1}
          </button>
        ))}
        <button onClick={handleNewChat} className="px-3 py-1 rounded-full bg-green-500 text-white hover:bg-green-600 transition font-medium">➕ New Chat</button>
        <button onClick={() => setGenerateImageMode(prev => !prev)}
          className={`px-3 py-1 rounded-full transition font-medium ${generateImageMode ? "bg-purple-500 text-white" : "bg-gray-400 text-black hover:bg-gray-500"}`}>
          {generateImageMode ? "🖼 Image Mode" : "💬 Text Mode"}
        </button>
      </div>

      {/* Messages List */}
      <div className={`h-96 overflow-y-auto p-4 rounded-xl shadow-inner ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
        {messages.map((msg, index) => (
          <motion.div key={index} initial={{ opacity: 0, x: msg.isUser ? 30 : -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
            className={`p-3 rounded-lg max-w-lg ${msg.isUser ? "ml-auto bg-blue-500 text-white" : "bg-gray-600 text-white"}`}>
            <strong>{msg.isUser ? "You" : botName}:</strong>{" "}
            <span
              dangerouslySetInnerHTML={{
                __html: searchTerm
                  ? msg.text.replace(new RegExp(`(${searchTerm})`, "gi"), '<mark class="bg-yellow-300">$1</mark>')
                  : msg.text,
              }}
            />
          </motion.div>
        ))}
        {typingBotMessage && (
          <motion.div className="p-3 mt-2 rounded-lg max-w-lg bg-gray-600 text-white">
            <strong>{botName}:</strong>{" "}
            <span dangerouslySetInnerHTML={{ __html: typingBotMessage }} />
          </motion.div>
        )}
        {isLoading && !typingBotMessage && (
          <p className="mt-2 animate-pulse text-gray-400">🤖 Bot is typing...</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold mb-1">💡 Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setUserMessage(s)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-medium transition">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center gap-2 mt-6">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64Image = reader.result;
                setUploadedImage(base64Image);
                setMessages((prev) => [...prev, {
                  text: `<img src="${base64Image}" alt="uploaded" class="rounded-lg max-w-full" />`, isUser: true
                }]);
                (async () => {
                  try {
                    await fetch(`http://localhost:8000/chats/${chatId}/upload-image`, {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ image: base64Image }),
                    });
                  } catch (error) {
                    console.error("Failed to upload image to backend:", error);
                  }
                })();
              };
              reader.readAsDataURL(file);
            }
          }}
          className="hidden"
          id="imageUpload"
        />
        <label htmlFor="imageUpload" className="cursor-pointer px-3 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded-lg">
          📁 Upload Image
        </label>

        <input
          type="text"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your message..."
          className={`flex-1 px-4 py-2 rounded-lg outline-none ${darkMode ? "bg-gray-700 text-white" : "bg-white text-black"}`}
        />

        <button
          onClick={() => {
            if (!recognitionRef.current) return;
            if (isRecording) {
              recognitionRef.current.stop();
            } else {
              recognitionRef.current.start();
            }
            setIsRecording(!isRecording);
          }}
          className={`px-3 py-2 rounded-full ${isRecording ? "bg-red-500" : "bg-green-500"} text-white transition`}
        >
          🎤
        </button>

        <button onClick={handleSend} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition">
          🚀 Send
        </button>
      </div>
    </div>
  </div>
);

};

export default Chatbot;
