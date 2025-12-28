import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../auth/AuthContext";

export default function ProjectTeam({ projectId }) {
    const { user } = useAuth(); 
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    
    const myId = user?.userId || user?.id;

    const [showAddForm, setShowAddForm] = useState(false);
    const [newUserId, setNewUserId] = useState("");
    const [newUserRole, setNewUserRole] = useState("MEMBER");

    useEffect(() => {
        fetchMembers();
    }, [projectId, myId]);

    const fetchMembers = async () => {
        try {
            const res = await api.get(`/projects/${projectId}/members?limit=100`);
            const memberList = res.data.data;
            setMembers(memberList);
            
            if (myId) {
                const myMembership = memberList.find(m => String(m.id) === String(myId));
                if (myMembership) {
                    setCurrentUserRole(myMembership.role);
                }
            }
        } catch (err) {
            console.error("Failed to load team", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (targetUserId, newRole) => {
        try {
            await api.patch(`/projects/${projectId}/members/${targetUserId}`, { role: newRole });
            
            setMembers(prev => prev.map(m => 
                m.id === targetUserId ? { ...m, role: newRole } : m
            ));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update role");
        }
    };

    const handleRemoveMember = async (targetUserId) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        
        try {
            await api.delete(`/projects/${projectId}/members/${targetUserId}`);
            setMembers(prev => prev.filter(m => m.id !== targetUserId));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to remove member");
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/projects/${projectId}/members`, { 
                userId: newUserId, 
                role: newUserRole 
            });
            
            fetchMembers();
            setShowAddForm(false);
            setNewUserId("");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to add member. Check the User ID.");
        }
    };

    if (loading) return <div className="p-6 text-center text-gray-500 text-sm">Loading team...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h3 className="font-bold text-gray-900">Project Team</h3>
                    <p className="text-xs text-gray-500 mt-1">Manage access and roles</p>
                </div>
                
                {currentUserRole === 'MANAGER' && (
                    <button 
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                    >
                        {showAddForm ? "Cancel" : "+ Add Member"}
                    </button>
                )}
            </div>

            {showAddForm && (
                <div className="p-4 bg-blue-50 border-b border-blue-100 animate-fade-in">
                    <form onSubmit={handleAddMember} className="flex gap-2 items-center">
                        <input 
                            type="text" 
                            placeholder="Enter User UUID..." 
                            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={newUserId}
                            onChange={e => setNewUserId(e.target.value)}
                            required
                        />
                        <select 
                            value={newUserRole}
                            onChange={e => setNewUserRole(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                        >
                            <option value="MEMBER">Member</option>
                            <option value="MANAGER">Manager</option>
                        </select>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                            Add
                        </button>
                    </form>
                    <p className="text-[10px] text-blue-600 mt-2 px-1">
                        * You need the User ID (UUID) to add members.
                    </p>
                </div>
            )}

            <div className="divide-y divide-gray-100">
                {members.map((member) => (
                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                        
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                                {member.name ? member.name[0].toUpperCase() : "U"}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    {member.name || "Unknown User"} 
                                    {String(member.id) === String(myId) && (
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
                                            You
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {currentUserRole === 'MANAGER' && String(member.id) !== String(myId) ? (
                                <>
                                    <select
                                        value={member.role}
                                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                        className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white text-gray-700 cursor-pointer hover:border-gray-300 transition-colors"
                                    >
                                        <option value="MEMBER">Member</option>
                                        <option value="MANAGER">Manager</option>
                                    </select>
                                    
                                    <button 
                                        onClick={() => handleRemoveMember(member.id)}
                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                                        title="Remove from project"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </>
                            ) : (
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                                    member.role === 'MANAGER' 
                                        ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                        : 'bg-blue-50 text-blue-700 border-blue-100'
                                }`}>
                                    {member.role}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}