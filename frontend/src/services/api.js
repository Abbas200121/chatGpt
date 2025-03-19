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



export const sendMessage = async (message) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/message`,
      { content: message },
      { headers: getAuthHeaders() }
    );

    console.log("Full API Response:", response.data); // Debugging
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    return { response: "Server error, please try again!" };
  }
};

export const getProtectedData = async () => {
  const response = await axios.get(`${BASE_URL}/protected`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};


export const getMessages = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/messages`, {
      headers: getAuthHeaders(),
    });
    return response.data; // Ensure it returns an array directly
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};

