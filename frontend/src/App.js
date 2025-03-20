import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";  // ✅ Import Signup
import Chatbot from "./pages/Chatbot";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
};

const App = () => {
  useEffect(() => {
    // ✅ Clear token when frontend starts (to force login)
    localStorage.removeItem("token");
  }, []);

  return (
    <Router>
      <Routes>
      <Route path="/" element={<Login />} />
        <Route path="/login/*" element={<Login />} /> {/* ✅ Allow query params */}
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chatbot />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
