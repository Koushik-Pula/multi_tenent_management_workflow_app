import { useState } from "react";
import { inviteUser } from "../../api/users";

export default function InviteUserModal() {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("MEMBER");
    const [inviteLink, setInviteLink] = useState("");
    const [error, setError] = useState("");
    const [showLink, setShowLink] = useState(false);

    const submit = async () => {
        setError("");
        setInviteLink("");
        setShowLink(false);

        try {
            const res = await inviteUser(email, role);
            setInviteLink(res.data.inviteLink);
            setShowLink(true);
            setEmail("");
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to create invite"
            );
        }
    };

    const toggleLinkVisibility = () => {
        setShowLink(prev => !prev);
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <input
                    className="border px-3 py-1 rounded w-64"
                    placeholder="user@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />

                <select
                    className="border px-2 rounded"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                >
                    <option value="MEMBER">MEMBER</option>
                    <option value="ADMIN">ADMIN</option>
                </select>

                <button
                    onClick={submit}
                    className="bg-blue-600 text-white px-3 rounded"
                >
                    Invite
                </button>
            </div>

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            {inviteLink && (
                <div className="mt-2 bg-gray-100 border p-3 rounded text-sm">
                    <div className="flex justify-between items-center mb-1">
                        <p className="font-medium">
                            Invite link
                        </p>

                        <button
                            onClick={toggleLinkVisibility}
                            className="text-blue-600 text-sm"
                        >
                            {showLink ? "Hide" : "Show"}
                        </button>
                    </div>

                    {showLink && (
                        <div className="flex items-center gap-2">
                            <input
                                readOnly
                                value={inviteLink}
                                className="flex-1 border px-2 py-1 rounded bg-white"
                            />

                            <button
                                onClick={() =>
                                    navigator.clipboard.writeText(inviteLink)
                                }
                                className="text-blue-600 text-sm"
                            >
                                Copy
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
