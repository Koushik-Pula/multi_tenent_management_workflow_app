import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function AuditLogWidget({ projectId = null, limit = 5 }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const endpoint = projectId 
                    ? `/audits/projects/${projectId}/audit-logs`
                    : `/audits/audit-logs`; 

                const res = await api.get(endpoint, {
                    params: { limit }
                });
                
                setLogs(res.data.data);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [projectId, limit]);

    if (loading) return <div className="p-6 text-center text-sm text-gray-400">Loading activity...</div>;
    if (error) return null; 

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Recent Activity</h3>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {projectId ? "Project History" : "System History"}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {logs.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                        No recent activity found.
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                            <div className="mt-1">
                                <ActivityIcon entity={log.entity} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 truncate">
                                    <span className="font-medium">{log.user_name}</span>
                                    <span className="text-gray-500 mx-1">
                                        {formatAction(log.action)}
                                    </span>
                                    
                                    {/* --- UPDATED LOGIC HERE --- */}
                                    <span className="font-medium text-gray-800">
                                        {formatEntityName(log)}
                                    </span>
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {new Date(log.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// --- Helper to extract the real name ---
function formatEntityName(log) {
    // 1. If we have specific details, use them
    if (log.details) {
        // For Tasks: use title
        if (log.details.title) return `"${log.details.title}"`;
        // For Projects: use name
        if (log.details.name) return `"${log.details.name}"`;
        // For Members: try to show role or generic text
        if (log.entity === 'MEMBER' || log.entity === 'PROJECT_MEMBER') {
            return log.details.role ? `a ${log.details.role.toLowerCase()}` : "a team member";
        }
    }

    // 2. Fallback: If no details, just show the entity type (e.g., "Task")
    return log.entity.toLowerCase();
}

function formatAction(action) {
    return action.toLowerCase().replace(/_/g, " ");
}

function ActivityIcon({ entity }) {
    // (Keep your existing icon logic here - no changes needed)
    switch (entity) {
        case "PROJECT":
            return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">P</div>;
        case "TASK":
            return <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">T</div>;
        case "MEMBER":
        case "PROJECT_MEMBER":
            return <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">M</div>;
        default:
            return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">A</div>;
    }
}