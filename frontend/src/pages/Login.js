import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const BASE_URL = "http://localhost:8000";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ✅ Handle token from Google callback only once
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get("token");

    if (token) {
      console.log("✅ Google login token received:", token);
      localStorage.setItem("token", token);

      // ✅ Clean the URL
      window.history.replaceState({}, document.title, "/chat");
      navigate("/chat", { replace: true });
    }

    // ✅ Already logged in? Redirect
    const localToken = localStorage.getItem("token");
    if (localToken) {
      navigate("/chat");
    }
  }, [location.search, navigate]);

  // ✅ Handle email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${BASE_URL}/login`,
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        navigate("/chat");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.detail || "Login failed.");
    }
  };

  // ✅ Redirect to Google auth
  const handleGoogleLogin = () => {
    window.location.href = `${BASE_URL}/auth/google`;
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

        <button
          onClick={handleGoogleLogin}
          className="w-full p-3 mt-4 bg-red-500 rounded-lg text-white"
        >
          Login with Google
        </button>

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
