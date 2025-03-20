import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const response = await axios.post(
        "http://localhost:8000/signup",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Signup Response:", response.data);

      if (response.status === 200 || response.status === 201) { 
        alert("Signup successful!");
        navigate("/chat"); // Redirect to chat page
      } else {
        setError("Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("Signup Error:", error.response?.data || error.message);
      setError(error.response?.data?.detail || "Signup failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md w-full bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-center text-2xl font-bold mb-4">Sign Up</h2>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <form onSubmit={handleSignup} className="space-y-4">
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
            Sign Up
          </button>
        </form>

        <p className="text-center mt-4">
          Already have an account?{" "}
          <span className="text-blue-400 cursor-pointer" onClick={() => navigate("/login")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
