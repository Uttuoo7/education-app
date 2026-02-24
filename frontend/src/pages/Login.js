import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_BASE from "@/config";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      await axios.post(
       `${API_BASE}/auth/login`,
       formData,
       {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
         },
          withCredentials: true,   // 🔥 VERY IMPORTANT
        }
      );
      

      navigate("/dashboard");
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          Login to ClassHub
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 border rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 border rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-lg"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;