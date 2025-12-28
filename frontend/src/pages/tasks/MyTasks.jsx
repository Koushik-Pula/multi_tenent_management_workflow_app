import { useState, useEffect } from "react";
import api from "../../api/axios";

export default function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await api.get("/tasks/my-tasks");
                setTasks(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    if (loading) return <div className="p-8">Loading your tasks...</div>;

    return (
        <div className="max-w-5xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6">My Assigned Tasks</h1>
            
            {tasks.length === 0 ? (
                <div className="bg-white p-10 rounded-xl border text-center text-gray-500">
                    You have no tasks assigned to you.
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Task</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Project</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {tasks.map(task => (
                                <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{task.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{task.project_name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            task.status === 'Done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}