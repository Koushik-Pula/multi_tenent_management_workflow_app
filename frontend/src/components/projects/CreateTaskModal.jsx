import { useState, useEffect } from "react";
import api from "../../api/axios";

export default function CreateTaskModal({ projectId, onTaskCreated }) {
    const [isOpen, setIsOpen] = useState(false);
    const [members, setMembers] = useState([]);
    
    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("3");
    const [dueDate, setDueDate] = useState("");
    const [assignedTo, setAssignedTo] = useState(""); // Stores User ID
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Load members when modal opens
    useEffect(() => {
        if (isOpen) {
            api.get(`/projects/${projectId}/members`)
               .then(res => setMembers(res.data.data))
               .catch(err => console.error("Failed to load members", err));
        }
    }, [isOpen, projectId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Sends snake_case to match Backend Controller
            await api.post(`/tasks/projects/${projectId}/tasks`, {
                title,
                description,
                priority: parseInt(priority),
                due_date: dueDate || null,
                assigned_to: assignedTo || null 
            });
            
            setIsOpen(false);
            resetForm();
            if (onTaskCreated) onTaskCreated();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setPriority("3");
        setDueDate("");
        setAssignedTo("");
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add Task
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900">New Task</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded">{error}</div>}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                                <input
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full border-gray-300 rounded-lg px-3 py-2 border focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="What needs to be done?"
                                />
                            </div>

                            {/* --- New Assignee Dropdown --- */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                                <select
                                    value={assignedTo}
                                    onChange={e => setAssignedTo(e.target.value)}
                                    className="w-full border-gray-300 rounded-lg px-3 py-2 border bg-white"
                                >
                                    <option value="">Unassigned</option>
                                    {members.map(member => (
                                        <option key={member.id} value={member.id}>
                                            {member.email} ({member.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={e => setPriority(e.target.value)}
                                        className="w-full border-gray-300 rounded-lg px-3 py-2 border bg-white"
                                    >
                                        <option value="3">Low</option>
                                        <option value="2">Medium</option>
                                        <option value="1">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                        className="w-full border-gray-300 rounded-lg px-3 py-2 border"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    rows="3"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full border-gray-300 rounded-lg px-3 py-2 border resize-none"
                                />
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
                                    {loading ? "Creating..." : "Create Task"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}