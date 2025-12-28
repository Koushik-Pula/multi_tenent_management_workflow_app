import { useEffect, useState } from "react";
import { taskService } from "../../api/tasks";
import CreateTaskModal from "./CreateTaskModal";
import { useAuth } from "../../auth/AuthContext";

export default function TaskBoard({ projectId }) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userProjectRole, setUserProjectRole] = useState("MEMBER");

    // FIX 1: Robust ID extraction (same as ProjectTeam.jsx)
    const myId = user?.userId || user?.id;

    const loadData = async () => {
        try {
            const [taskRes, memberRes] = await Promise.all([
                taskService.getProjectTasks(projectId),
                taskService.getProjectMembers(projectId)
            ]);
            
            const taskData = taskRes.data.data;
            const memberData = memberRes.data.data;

            setTasks(taskData);
            setMembers(memberData);

            // FIX 2: Robust Role Check (String comparison)
            // This ensures we find the user even if ID types (string vs number) differ
            if (myId) {
                const currentUserInProject = memberData.find(m => String(m.id) === String(myId));
                if (currentUserInProject) {
                    setUserProjectRole(currentUserInProject.role);
                }
            }
            
            if (user.role === 'ADMIN') {
                setUserProjectRole('MANAGER');
            }

        } catch (err) {
            console.error("Board load error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) loadData();
    // FIX 3: Depend on myId instead of user.userId to prevent reload loops
    }, [projectId, myId]);

    const handleAssign = async (taskId, userId) => {
        try {
            if (!userId || userId === "") {
                await taskService.unassign(projectId, taskId);
            } else {
                await taskService.assign(projectId, taskId, userId);
            }
            loadData(); 
        } catch (err) {
            alert(err.response?.data?.message || "Assignment failed");
        }
    };

    const handleDelete = async (taskId) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        try {
            await taskService.delete(projectId, taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (err) {
            alert(err.response?.data?.message || "Delete failed");
        }
    };

    const moveTask = async (taskId, newStatus) => {
        const previousTasks = [...tasks];
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        try {
            await taskService.updateStatus(projectId, taskId, newStatus);
        } catch (err) {
            setTasks(previousTasks);
            alert(err.response?.data?.message || "Status update failed");
        }
    };

    if (loading) return <div className="text-center py-10 text-gray-500 font-medium">Loading project board...</div>;

    const columns = [
        { title: "To Do", status: "TODO", color: "bg-gray-100", accent: "border-gray-400" },
        { title: "In Progress", status: "IN_PROGRESS", color: "bg-blue-50", accent: "border-blue-400" },
        { title: "Done", status: "DONE", color: "bg-green-50", accent: "border-green-400" }
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 px-2">
                <h2 className="text-lg font-bold text-gray-800">Project Board</h2>
                {userProjectRole === 'MANAGER' && (
                    <CreateTaskModal projectId={projectId} onTaskCreated={loadData} />
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-6 h-full overflow-x-auto pb-4 px-2">
                {columns.map(col => (
                    <Column 
                        key={col.status}
                        title={col.title}
                        color={col.color}
                        accent={col.accent}
                        tasks={tasks.filter(t => t.status === col.status)}
                        onMove={moveTask}
                        onAssign={handleAssign}
                        onDelete={handleDelete}
                        members={members}
                        userRole={userProjectRole}
                        currentUserId={myId} // Pass robust ID
                    />
                ))}
            </div>
        </div>
    );
}

function Column({ title, tasks, color, accent, onMove, onAssign, onDelete, members, userRole, currentUserId }) {
    return (
        <div className={`flex-1 min-w-[300px] rounded-xl ${color} p-4 flex flex-col shadow-sm border border-gray-100`}>
            <div className={`flex justify-between items-center mb-4 pb-2 border-b-2 ${accent}`}>
                <h3 className="font-semibold text-gray-700">{title}</h3>
                <span className="bg-white/50 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">{tasks.length}</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto min-h-[200px]">
                {tasks.map(task => (
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        onMove={onMove} 
                        onAssign={onAssign} 
                        onDelete={onDelete} 
                        members={members}
                        userRole={userRole}
                        currentUserId={currentUserId}
                    />
                ))}
                {tasks.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-sm italic">No tasks</div>
                )}
            </div>
        </div>
    );
}

function TaskCard({ task, onMove, onAssign, onDelete, members, userRole, currentUserId }) {
    const isDone = task.status === "DONE";
    const isManager = userRole === 'MANAGER';
    
    // FIX 4: Robust comparison for "Assigned To Me" check
    const isAssignedToMe = String(task.assigned_to) === String(currentUserId);
    const canMove = isManager || isAssignedToMe;

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                    task.priority >= 3 ? "text-red-600 bg-red-50" : "text-blue-600 bg-blue-50"
                }`}>
                    {task.priority === 1 ? "High" : task.priority === 2 ? "Medium" : "Low"}
                </span>

                {isManager && !isDone && (
                    <button 
                        onClick={() => onDelete(task.id)} 
                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                        title="Delete Task"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                    </button>
                )}
            </div>

            <h4 className="font-medium text-gray-900 mb-1 leading-tight">{task.title}</h4>
            {task.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>
            )}
            
            <div className="flex flex-col gap-3 mt-4 pt-3 border-t border-gray-50">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase">Assignee</label>
                    
                    <select
                        disabled={!isManager || isDone}
                        className={`text-[11px] border rounded-md px-2 py-1 outline-none w-full transition-colors ${
                            !isManager ? "bg-gray-100 cursor-not-allowed border-transparent text-gray-500" : "bg-gray-50 border-gray-200 cursor-pointer text-gray-700 hover:border-blue-300"
                        }`}
                        value={task.assigned_to || ""}
                        onChange={(e) => onAssign(task.id, e.target.value)}
                    >
                        <option value="">Unassigned</option>
                        {members.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.name || m.email}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-gray-400 uppercase">Status</label>
                        
                        <select 
                            disabled={!canMove || isDone}
                            className={`text-[11px] font-bold border-none bg-transparent p-0 focus:ring-0 ${
                                !canMove ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:text-blue-600 cursor-pointer"
                            }`}
                            value={task.status}
                            onChange={(e) => onMove(task.id, e.target.value)}
                        >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}