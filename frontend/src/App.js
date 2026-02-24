import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import API_BASE from "./config";
import { Toaster } from "@/components/ui/sonner";
import "@/App.css";
import { AuthProvider } from "@/context/AuthContext";

// Code-split each page into its own chunk — only loaded when navigated to
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const Dashboard   = lazy(() => import("@/pages/Dashboard"));
const Login       = lazy(() => import("@/pages/Login"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));

// Lightweight fallback shown while a page chunk is loading
const PageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
  </div>
);

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
          <Suspense fallback={<PageSpinner />}>
            <Routes>
              <Route path="/"         element={<LandingPage />} />
              <Route path="/login"    element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="*"         element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <Toaster position="bottom-right" />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;