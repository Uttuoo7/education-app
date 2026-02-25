import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import API_BASE from "@/config";
import { useAuth } from "@/context/AuthContext";

const Register = () => {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (form.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE}/auth/register`, {
                name: form.name,
                email: form.email,
                password: form.password,
            });
            // Auto-login after register
            const formData = new URLSearchParams();
            formData.append("username", form.email);
            formData.append("password", form.password);
            const loginRes = await axios.post(`${API_BASE}/auth/login`, formData, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                withCredentials: true,
            });
            // login response includes user — set in context before navigating
            if (loginRes.data?.user) setUser(loginRes.data.user);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.detail || "Registration failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]">
            <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
                <div className="text-center mb-6">
                    <img src="/logo.png" alt="StarZEdu Classes" className="h-16 w-auto mx-auto mb-3" />
                    <h2 className="text-2xl font-bold text-slate-900 font-outfit">Create an account</h2>
                    <p className="text-stone-500 text-sm mt-1 font-manrope">Join StarZEdu Classes today — it's free</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        className="w-full p-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-manrope"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        className="w-full p-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-manrope"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password (min 6 characters)"
                        className="w-full p-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-manrope"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        className="w-full p-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-manrope"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white p-3 rounded-lg font-medium transition-colors font-manrope"
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </form>

                <p className="text-center text-sm text-stone-500 mt-6 font-manrope">
                    Already have an account?{" "}
                    <Link to="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
