import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
    const { login, user } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // 🔐 If already logged in, redirect to dashboard
    if (user) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
        } catch (err) {
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded shadow w-80"
            >
                <h2 className="text-xl font-semibold mb-4 text-center">
                    Login
                </h2>

                {error && (
                    <p className="text-red-500 text-sm mb-3 text-center">
                        {error}
                    </p>
                )}

                <input
                    type="email"
                    placeholder="Email"
                    className="w-full border p-2 mb-3"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <div className="relative mb-4">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="w-full border p-2 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        className="absolute right-2 top-2 text-sm text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>

                <button
                    disabled={loading}
                    className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-60"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>

                <p className="text-sm mt-4 text-center">
                    New organization?{" "}
                    <a href="/signup" className="text-blue-600 underline">
                        Create one
                    </a>
                </p>
            </form>
        </div>
    );
}
