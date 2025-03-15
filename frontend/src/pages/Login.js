import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log("Sending data:", { email, password });
  
      const response = await axios.post(
        "http://localhost:8000/login",
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,  // ✅ Ensure credentials are sent
        }
      );
  
      console.log("Server Response:", response.data);
  
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        alert("Login successful!");
        navigate("/chat");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Login Error:", error.response ? error.response.data : error.message);
      setError(error.response?.data?.detail || "Invalid credentials. Please try again.");
    }
  };
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md w-full bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-center text-2xl font-bold mb-4">Login</h2>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 text-white bg-gray-700 rounded-lg outline-none"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 text-white bg-gray-700 rounded-lg outline-none"
            required
          />
          <button type="submit" className="w-full p-3 bg-blue-500 rounded-lg text-white">
            Login
          </button>
        </form>

        <p className="text-center mt-4">
          Don't have an account?{" "}
          <span className="text-blue-400 cursor-pointer" onClick={() => navigate("/signup")}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
