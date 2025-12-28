import { useEffect, useState } from "react";
import {
    fetchUsers,
    updateUserRole,
    deactivateUser,
    reactivateUser
} from "../../api/users";

export default function UsersTable() {
    const [users, setUsers] = useState([]);
    const [loadingUserId, setLoadingUserId] = useState(null);

    const loadUsers = async () => {
        try {
            const res = await fetchUsers();
            setUsers(res.data.data);
        } catch (err) {
            console.error("Failed to load users", err);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const toggleRole = async (user) => {
        setLoadingUserId(user.id);
        const newRole = user.role === "ADMIN" ? "MEMBER" : "ADMIN";

        // Optimistic UI update: Update state immediately before API call
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));

        try {
            await updateUserRole(user.id, newRole);
        } catch {
            // Revert on failure
            setUsers(prev => prev.map(u => u.id === user.id ? user : u));
        } finally {
            setLoadingUserId(null);
        }
    };

    const toggleActive = async (user) => {
        setLoadingUserId(user.id);
        const newStatus = !user.is_active;

        // Optimistic UI update
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));

        try {
            if (user.is_active) {
                await deactivateUser(user.id);
            } else {
                await reactivateUser(user.id);
            }
        } catch {
            // Revert on failure
            setUsers(prev => prev.map(u => u.id === user.id ? user : u));
        } finally {
            setLoadingUserId(null);
        }
    };

    // Helper to generate initials from name or email
    const getInitials = (name) => {
        return name 
            ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) 
            : "U";
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {users.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    No employees found. Invite someone to get started!
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                <th className="p-4">Employee</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(user => {
                                const displayName = user.name || user.email.split("@")[0];
                                
                                return (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {/* Avatar Circle */}
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden ring-1 ring-gray-200 relative">
                                                    {user.avatar_url ? (
                                                        <img 
                                                            src={user.avatar_url} 
                                                            alt={displayName}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none'; // Hide broken image
                                                                e.target.nextSibling.classList.remove('hidden'); // Show fallback
                                                            }}
                                                        />
                                                    ) : null}
                                                    
                                                    {/* Fallback Initials (Hidden if image loads) */}
                                                    <div className={`w-full h-full flex items-center justify-center text-sm font-bold text-gray-600 ${user.avatar_url ? 'hidden' : 'flex'}`}>
                                                        {getInitials(displayName)}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {displayName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                user.role === "ADMIN" 
                                                    ? "bg-purple-50 text-purple-700 border-purple-100" 
                                                    : "bg-blue-50 text-blue-700 border-blue-100"
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>

                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                user.is_active 
                                                    ? "bg-green-50 text-green-700 border-green-100" 
                                                    : "bg-red-50 text-red-700 border-red-100"
                                            }`}>
                                                {user.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>

                                        <td className="p-4 text-right whitespace-nowrap">
                                            {/* Actions appear on hover (opacity-0 -> opacity-100) */}
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    disabled={loadingUserId === user.id}
                                                    onClick={() => toggleRole(user)}
                                                    className="text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                                                >
                                                    {user.role === "ADMIN" ? "Demote" : "Promote"}
                                                </button>
                                                
                                                <span className="text-gray-300">|</span>

                                                <button
                                                    disabled={loadingUserId === user.id}
                                                    onClick={() => toggleActive(user)}
                                                    className={`text-xs font-medium transition-colors disabled:opacity-50 ${
                                                        user.is_active 
                                                            ? "text-gray-500 hover:text-red-600" 
                                                            : "text-green-600 hover:text-green-700"
                                                    }`}
                                                >
                                                    {user.is_active ? "Deactivate" : "Activate"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}