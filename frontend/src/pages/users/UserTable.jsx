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
        const res = await fetchUsers();
        setUsers(res.data.data);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const toggleRole = async (user) => {
        setLoadingUserId(user.id);

        const newRole = user.role === "ADMIN" ? "MEMBER" : "ADMIN";

        setUsers(prev =>
            prev.map(u =>
                u.id === user.id ? { ...u, role: newRole } : u
            )
        );

        try {
            await updateUserRole(user.id, newRole);
        } catch {
            setUsers(prev =>
                prev.map(u =>
                    u.id === user.id ? user : u
                )
            );
        } finally {
            setLoadingUserId(null);
        }
    };

    const toggleActive = async (user) => {
        setLoadingUserId(user.id);

        const newStatus = !user.is_active;

        setUsers(prev =>
            prev.map(u =>
                u.id === user.id
                    ? { ...u, is_active: newStatus }
                    : u
            )
        );

        try {
            if (user.is_active) {
                await deactivateUser(user.id);
            } else {
                await reactivateUser(user.id);
            }
        } catch {
            setUsers(prev =>
                prev.map(u =>
                    u.id === user.id ? user : u
                )
            );
        } finally {
            setLoadingUserId(null);
        }
    };

    return (
        <div className="bg-white border rounded">
            {users.length === 0 && (
                <div className="p-6 text-sm text-gray-500">
                    No users found.
                </div>
            )}

            {users.length > 0 && (
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left">User</th>
                            <th className="text-left">Role</th>
                            <th className="text-left">Status</th>
                            <th className="text-right pr-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-t">
                                <td className="p-3">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">
                                            {user.name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {user.email}
                                        </span>
                                    </div>
                                </td>

                                <td>{user.role}</td>
                                <td>
                                    {user.is_active ? "Active" : "Inactive"}
                                </td>

                                <td className="text-right pr-4 space-x-3">
                                    <button
                                        disabled={loadingUserId === user.id}
                                        onClick={() => toggleRole(user)}
                                        className="text-blue-600 hover:underline disabled:opacity-50"
                                    >
                                        Toggle Role
                                    </button>

                                    <button
                                        disabled={loadingUserId === user.id}
                                        onClick={() => toggleActive(user)}
                                        className={
                                            user.is_active
                                                ? "text-red-600 hover:underline disabled:opacity-50"
                                                : "text-green-600 hover:underline disabled:opacity-50"
                                        }
                                    >
                                        {user.is_active
                                            ? "Deactivate"
                                            : "Activate"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
