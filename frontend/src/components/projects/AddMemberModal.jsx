import { useState, useEffect } from "react";
import api from "../../api/axios";

export default function AddMemberModal({ projectId, onMemberAdded }) {
    const [isOpen, setIsOpen] = useState(false);
    const [orgUsers, setOrgUsers] = useState([]); // All users in the Org
    
    const [selectedUserId, setSelectedUserId] = useState("");
    const [role, setRole] = useState("MEMBER");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch all org users when modal opens so we have a list to choose from
    useEffect(() => {
        if (isOpen) {
            api.get("/users")
               .then(res => setOrgUsers(res.data.data))
               .catch(err => console.error("Failed to load users", err));
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!selectedUserId) {
            setError("Please select a user");
            setLoading(false);
            return;
        }

        try {
            await api.post(`/projects/${projectId}/members`, {
                userId: selectedUserId,
                role: role
            });
            setIsOpen(false);
            setSelectedUserId("");
            if (onMemberAdded) onMemberAdded();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to add member");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                Add Member
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900">Add Team Member</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded">{error}</div>}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="w-full border-gray-300 rounded-lg px-3 py-2 border bg-white focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">-- Select a user --</option>
                                    {orgUsers.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.name || u.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full border-gray-300 rounded-lg px-3 py-2 border bg-white focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="MEMBER">Member (Can view & work on tasks)</option>
                                    <option value="MANAGER">Manager (Can edit project & settings)</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-70"
                                >
                                    {loading ? "Adding..." : "Add to Project"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}