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

      // Typing effect
      let displayed = "";
      const interval = setInterval(() => {
        displayed = botReply.slice(0, displayed.length + 1);
        setTypingBotMessage(displayed);

        if (displayed.length >= botReply.length) {
          clearInterval(interval);
          setTypingBotMessage(null);
          setMessages((prev) => [...prev, { text: botReply, isUser: false }]);
          setIsLoading(false);

          // 🗣 Speak reply (skip images)
          if (!isImage && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(botReply);
            const selectedVoice = speechSynthesis.getVoices().find(v => v.name === botVoices[language]);
            if (selectedVoice) utterance.voice = selectedVoice;
            utterance.lang = supportedLanguages[language];
            speechSynthesis.speak(utterance);
          }
        }
      }, 30);
    }
  } catch (error) {
    console.error("Error:", error);
    setMessages((prev) => [...prev, { text: `Error: ${error.message}`, isUser: false }]);
    setIsLoading(false);
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
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className={`max-w-4xl w-full p-6 rounded-lg shadow-lg relative ${darkMode ? "bg-gray-800" : "bg-white"}`}>

        <h2 className="text-center text-2xl font-bold mb-4">Chat with {botName}</h2>

        <div className="absolute top-4 left-4 flex space-x-2">
  <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${darkMode ? "bg-gray-200 text-black" : "bg-gray-800 text-white"}`}>
    {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
  </button>

  <button
    onClick={() => {
      const next = language === "en" ? "ar" : language === "ar" ? "he" : "en";
      setLanguage(next);
    }}
    className="p-2 rounded-lg bg-blue-500 text-white"
  >
    🌐 {language.toUpperCase()}
  </button>
</div>

        <button onClick={handleLogout} className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-lg">Logout</button>
        <button onClick={handleExportPDF} className="absolute top-4 right-28 p-2 bg-yellow-500 text-black rounded-lg">Export PDF</button>

        <div className="flex flex-wrap gap-2 mb-4 mt-8">
          {chats.map((chat, index) => (
            <button key={chat.id} onClick={() => { setChatId(chat.id); fetchMessages(chat.id); }} className={`p-2 rounded-lg ${chat.id === chatId ? "bg-blue-500 text-white" : "bg-gray-600 text-white"}`}>
              Chat {index + 1}
            </button>
          ))}
          <button onClick={handleNewChat} className="p-2 bg-green-500 rounded-lg text-white">New Chat</button>
          <button onClick={() => setGenerateImageMode((prev) => !prev)} className={`p-2 rounded-lg ${generateImageMode ? "bg-purple-500 text-white" : "bg-gray-400 text-black"}`}>
            {generateImageMode ? "🖼 Image Mode ON" : "💬 Text Mode ON"}
          </button>
        </div>

        <div className={`h-96 overflow-y-auto p-4 space-y-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
          {messages.map((msg, index) => (
            <motion.div key={index} initial={{ opacity: 0, x: msg.isUser ? 50 : -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
              className={`p-3 rounded-lg max-w-xs ${msg.isUser ? "bg-blue-500 text-white ml-auto" : "bg-gray-600 text-white"}`}>
              <strong>{msg.isUser ? "You" : botName}:</strong>{" "}
              <span dangerouslySetInnerHTML={{ __html: msg.text }} />
            </motion.div>
          ))}
          {typingBotMessage && (
  <motion.div className="p-3 rounded-lg max-w-xs bg-gray-600 text-white">
    <strong>{botName}:</strong> <span dangerouslySetInnerHTML={{ __html: typingBotMessage }} />
  </motion.div>
)}
{isLoading && !typingBotMessage && (
  <div className="animate-pulse text-gray-400">Bot is typing...</div>
)}

          <div ref={messagesEndRef} />
        </div>

        <div className="flex items-center mt-4">
       <input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;

        // Show in chat
        setUploadedImage(base64Image);
        setMessages((prev) => [
          ...prev,
          { text: `<img src="${base64Image}" alt="uploaded" class="rounded-lg max-w-full" />`, isUser: true },
        ]);

        // 🔁 Send to backend
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
  className="ml-2"
/>


          <input type="text" value={userMessage} onChange={(e) => setUserMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..." className={`flex-1 p-3 rounded-lg outline-none ${darkMode ? "bg-gray-700 text-white" : "bg-white text-black"}`} />
           

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
  className={`ml-2 p-2 rounded-full ${isRecording ? "bg-red-500" : "bg-green-500"} text-white`}
  title="Microphone"
>
  🎤
</button>

          <button onClick={handleSend} className="ml-2 p-2 bg-blue-500 rounded-full text-white">Send</button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
