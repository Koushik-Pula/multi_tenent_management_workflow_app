import { useEffect, useState } from "react";
import api from "../../api/axios";
import AddMemberModal from "./AddMemberModal";

export default function ProjectTeam({ projectId }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMembers = async () => {
        try {
            const res = await api.get(`/projects/${projectId}/members`);
            setMembers(res.data.data);
        } catch (err) {
            console.error("Failed to load members", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [projectId]);

    const removeMember = async (userId) => {
        if(!window.confirm("Are you sure you want to remove this member?")) return;
        try {
            await api.delete(`/projects/${projectId}/members/${userId}`);
            setMembers(prev => prev.filter(m => m.id !== userId));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to remove member");
        }
    };

    if (loading) return <div className="text-center py-10 text-gray-500">Loading team...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Team Members</h2>
                <AddMemberModal projectId={projectId} onMemberAdded={fetchMembers} />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {members.map(member => (
                            <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                            {member.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{member.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                        member.role === 'MANAGER' 
                                        ? "bg-purple-50 text-purple-700 border-purple-100" 
                                        : "bg-blue-50 text-blue-700 border-blue-100"
                                    }`}>
                                        {member.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => removeMember(member.id)}
                                        className="text-red-600 hover:text-red-800 text-xs font-medium hover:underline"
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {members.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                                    No members yet. Add someone to get started!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}