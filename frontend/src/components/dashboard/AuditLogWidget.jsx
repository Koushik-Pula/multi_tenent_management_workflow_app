import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function AuditLogWidget({ projectId = null, limit = 5, type = "all" }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                let endpoint;
                
                if (type === "personal") {
                    endpoint = `/audits/my-activity`;
                } else {
                    endpoint = projectId 
                        ? `/audits/projects/${projectId}/audit-logs`
                        : `/audits/audit-logs`; 
                }

                const res = await api.get(endpoint, {
                    params: { limit }
                });
                
                // Safety check: ensure we always have an array
                const logData = res.data.data || [];
                setLogs(Array.isArray(logData) ? logData : []);
                setError(false);
            } catch (err) {
                console.error("Audit Widget Fetch Error:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [projectId, limit, type]);

    if (loading) return <div className="p-6 text-center text-sm text-gray-400">Loading activity...</div>;
    
    // UPDATED: Show an error message instead of disappearing
    if (error) return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full flex items-center justify-center p-6">
            <div className="text-center">
                <p className="text-red-500 font-medium text-sm">Failed to load activity.</p>
                <p className="text-gray-400 text-xs mt-1">Check database columns.</p>
            </div>
        </div>
    );

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Recent Activity</h3>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {type === "personal" ? "My History" : projectId ? "Project History" : "System History"}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-500 italic">No recent activity found.</p>
                    </div>
                ) : (
                    logs.map((log, index) => (
                        <div key={log.id || index} className="p-4 flex gap-3 hover:bg-gray-50 transition-colors group">
                            <div className="mt-1">
                                <ActivityIcon entity={log.entity} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 truncate">
                                    <span className="font-medium">
                                        {type === "personal" ? "You" : log.user_name || "Unknown User"}
                                    </span>
                                    <span className="text-gray-500 mx-1">
                                        {formatAction(log.action)}
                                    </span>
                                    <span className="font-medium text-blue-700">
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

// --- HELPER FUNCTIONS ---

function formatEntityName(log) {
    if (log.details) {
        if (log.details.title) return `"${log.details.title}"`;
        if (log.details.name) return `"${log.details.name}"`;
        
        if (log.entity === 'MEMBER' || log.entity === 'PROJECT_MEMBER') {
            return log.details.user_name || (log.details.role ? `a ${log.details.role.toLowerCase()}` : "a team member");
        }
    }
    return log.entity.toLowerCase();
}

function formatAction(action) {
    const actionMap = {
        'CREATE_TASK': 'created',
        'UPDATE_TASK': 'updated',
        'DELETE_TASK': 'deleted',
        'ASSIGN_TASK': 'assigned',
        'UNASSIGN_TASK': 'unassigned',
        'UPDATE_TASK_STATUS': 'changed status of',
        'CREATE_PROJECT': 'created',
        'UPDATE_PROJECT': 'updated',
        'ARCHIVE_PROJECT': 'archived',
        'UNARCHIVE_PROJECT': 'unarchived',
        'ADD_PROJECT_MEMBER': 'added',
        'REMOVE_PROJECT_MEMBER': 'removed',
        'UPDATE_PROJECT_MEMBER_ROLE': 'changed role for'
    };

    return actionMap[action] || action.toLowerCase().replace(/_/g, " ");
}

function ActivityIcon({ entity }) {
    switch (entity) {
        case "PROJECT":
            return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">P</div>;
        case "TASK":
            return <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">T</div>;
        case "MEMBER":
        case "PROJECT_MEMBER":
            return <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">M</div>;
        default:
            return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">A</div>;
    }
}