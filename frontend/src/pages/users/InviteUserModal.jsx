import { useState } from "react";
import { inviteUser } from "../../api/users";

export default function InviteUserModal() {
    const [isOpen, setIsOpen] = useState(false);
    
    // Form States
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("MEMBER");
    const [loading, setLoading] = useState(false);
    
    // Result States
    const [inviteLink, setInviteLink] = useState("");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const resetForm = () => {
        setEmail("");
        setRole("MEMBER");
        setInviteLink("");
        setError("");
        setCopied(false);
    };

    const handleOpen = () => {
        resetForm();
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await inviteUser(email, role);
            setInviteLink(res.data.inviteLink);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create invite");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={handleOpen}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Invite Employee
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                        
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900">Invite New Employee</h3>
                            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {!inviteLink ? (
                                // --- State 1: Form ---
                                <form onSubmit={submit} className="space-y-4">
                                    {error && (
                                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                                            {error}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="colleague@company.com"
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                        <select
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border bg-white"
                                        >
                                            <option value="MEMBER">Member (Standard Access)</option>
                                            <option value="ADMIN">Admin (Full Access)</option>
                                        </select>
                                    </div>

                                    <div className="pt-2 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={loading}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all disabled:opacity-70 flex items-center gap-2"
                                        >
                                            {loading ? "Sending..." : "Send Invite"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                // --- State 2: Success / Copy Link ---
                                <div className="text-center space-y-4">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold text-gray-900">Invite Created!</h4>
                                        <p className="text-sm text-gray-500">Share this link with the new employee.</p>
                                    </div>

                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-2 rounded-lg">
                                        <input
                                            type="text"
                                            readOnly
                                            value={inviteLink}
                                            className="flex-1 bg-transparent border-none text-sm text-gray-600 focus:ring-0 px-2"
                                        />
                                        <button
                                            onClick={copyToClipboard}
                                            className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${
                                                copied 
                                                    ? "bg-green-100 text-green-700" 
                                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                            }`}
                                        >
                                            {copied ? "Copied!" : "Copy"}
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleClose}
                                        className="text-sm text-gray-500 hover:text-gray-900 underline mt-4"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}