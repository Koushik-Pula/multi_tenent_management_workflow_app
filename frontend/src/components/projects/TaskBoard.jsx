import { useEffect, useState } from "react";
import api from "../../api/axios";
import CreateTaskModal from "./CreateTaskModal"; // Import the modal

export default function TaskBoard({ projectId }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const res = await api.get(`/tasks/projects/${projectId}/tasks`);
            setTasks(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    const moveTask = async (taskId, newStatus) => {
        const previousTasks = [...tasks];
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

        try {
            await api.patch(`/tasks/projects/${projectId}/tasks/${taskId}/status`, { status: newStatus });
        } catch (err) {
            setTasks(previousTasks);
        }
    };

    const todos = tasks.filter(t => t.status === "TODO");
    const inProgress = tasks.filter(t => t.status === "IN_PROGRESS");
    const done = tasks.filter(t => t.status === "DONE");

    if (loading) return <div className="text-center py-10 text-gray-500">Loading board...</div>;

    return (
        <div className="flex flex-col h-full">
            {/* --- Board Header with Action --- */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Board</h2>
                <CreateTaskModal projectId={projectId} onTaskCreated={fetchTasks} />
            </div>

            {/* --- Columns --- */}
            <div className="flex flex-col md:flex-row gap-6 h-full overflow-x-auto pb-4">
                <Column title="To Do" tasks={todos} status="TODO" color="bg-gray-100" accent="border-gray-400" onMove={moveTask} />
                <Column title="In Progress" tasks={inProgress} status="IN_PROGRESS" color="bg-blue-50" accent="border-blue-400" onMove={moveTask} />
                <Column title="Done" tasks={done} status="DONE" color="bg-green-50" accent="border-green-400" onMove={moveTask} />
            </div>
        </div>
    );
}

// ... (Keep Column and TaskCard components exactly the same as before) ...
function Column({ title, tasks, status, color, accent, onMove }) {
    return (
        <div className={`flex-1 min-w-[300px] rounded-xl ${color} p-4 flex flex-col`}>
            <div className={`flex justify-between items-center mb-4 pb-2 border-b-2 ${accent}`}>
                <h3 className="font-semibold text-gray-700">{title}</h3>
                <span className="bg-white/50 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                    {tasks.length}
                </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
                {tasks.map(task => (
                    <TaskCard key={task.id} task={task} onMove={onMove} />
                ))}
                {tasks.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                        No tasks
                    </div>
                )}
            </div>
        </div>
    );
}

function TaskCard({ task, onMove }) {
    const pColor = task.priority >= 3 ? "text-red-600 bg-red-50" : task.priority === 2 ? "text-orange-600 bg-orange-50" : "text-blue-600 bg-blue-50";
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${pColor}`}>
                    {task.priority === 1 ? "High" : task.priority === 2 ? "Medium" : "Low"}
                </span>
                
                <select 
                    className="text-xs border-none bg-transparent text-gray-400 hover:text-gray-700 cursor-pointer focus:ring-0"
                    value={task.status}
                    onChange={(e) => onMove(task.id, e.target.value)}
                >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                </select>
            </div>

            <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
            
            {task.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600 font-bold" title={task.assigned_to_name || "Unassigned"}>
                        {task.assigned_to_name ? task.assigned_to_name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <span className="text-xs text-gray-400 truncate max-w-[80px]">
                        {task.assigned_to_name || "Unassigned"}
                    </span>
                </div>
                
                {task.due_date && (
                    <span className="text-xs text-gray-400">
                        {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                )}
            </div>
        </div>
    );
}