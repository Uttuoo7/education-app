import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import API_BASE from "./config";
import { Toaster } from "@/components/ui/sonner";
import "@/App.css";
import SchedulePage from "./pages/SchedulePage";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";   // 👈 add this
import { AuthProvider } from "@/context/AuthContext";

function App() {

  useEffect(() => {
    fetch(`${API_BASE}/`)
      .then(res => res.json())
      .then(data => console.log("Backend says:", data))
      .catch(err => console.error("Backend error:", err));
  }, []);

  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />   {/* 👈 added */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="bottom-right" />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;