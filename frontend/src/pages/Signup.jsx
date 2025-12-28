import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Signup() {
    const navigate = useNavigate();

    const [orgName, setOrgName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await api.post("/auth/signup", {
                orgName,
                adminEmail,
                password
            });

            navigate("/login");
        } catch (err) {
            setError(err.response?.data?.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded shadow w-96"
            >
                <h2 className="text-xl font-semibold mb-4">
                    Create Organization
                </h2>

                {error && (
                    <p className="text-red-500 text-sm mb-3">{error}</p>
                )}

                <input
                    type="text"
                    placeholder="Organization Name"
                    className="w-full border p-2 mb-3"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                />

                <input
                    type="email"
                    placeholder="Admin Email"
                    className="w-full border p-2 mb-3"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
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
                    className="w-full bg-blue-600 text-white p-2 rounded"
                >
                    {loading ? "Creating..." : "Create Organization"}
                </button>
            </form>
        </div>
    );
}
