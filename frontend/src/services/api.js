import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000"; // FastAPI backend URL

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const signup = async (email, password) => {
  const response = await axios.post(`${BASE_URL}/signup`, { email, password });
  localStorage.setItem("token", response.data.token);
  return response.data.token;
};

export const login = async (email, password) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/login`,
      { email, password },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    localStorage.setItem("token", response.data.token);
    return response.data.token;
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error;
  }
};

export const getChats = async () => {
  const response = await axios.get(`${BASE_URL}/chats`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createNewChat = async () => {
  const response = await axios.post(`${BASE_URL}/chats/new`, {}, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getMessages = async (chatId) => {
  const response = await axios.get(`${BASE_URL}/chats/${chatId}/messages`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const sendMessage = async (chatId, message) => {
  const response = await axios.post(`${BASE_URL}/chats/${chatId}/send`, { content: message }, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ✅ Logout function (clear token)
export const logout = () => {
  localStorage.removeItem("token");
  window.location.href = "/";
};