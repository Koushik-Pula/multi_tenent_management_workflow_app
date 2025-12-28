import { useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import api from "../api/axios";

export default function AcceptInvite() {
    const [params] = useSearchParams();
    const token = params.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const submit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            await api.post("/users/accept-invite", {
                token,
                password
            });
            setSuccess(true);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to accept invite"
            );
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-6 rounded shadow w-96 text-center">
                    <h2 className="text-xl font-semibold mb-2">
                        Account created
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        You can now login using your credentials.
                    </p>
                    <a
                        href="/login"
                        className="text-blue-600 underline"
                    >
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form
                onSubmit={submit}
                className="bg-white p-6 rounded shadow w-96"
            >
                <h2 className="text-xl font-semibold mb-4">
                    Accept Invitation
                </h2>

                {error && (
                    <p className="text-red-600 text-sm mb-3">
                        {error}
                    </p>
                )}

                <input
                    type="password"
                    placeholder="Password"
                    className="w-full border p-2 mb-3"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Confirm Password"
                    className="w-full border p-2 mb-4"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                />

                <button
                    disabled={loading}
                    className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-60"
                >
                    {loading ? "Creating..." : "Accept Invite"}
                </button>
            </form>
        </div>
    );
}
