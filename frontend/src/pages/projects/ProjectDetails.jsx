import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import AuditLogWidget from "../../components/dashboard/AuditLogWidget";
import TaskBoard from "../../components/projects/TaskBoard";
// Ensure you saved the code above as ProjectTeam.jsx in this folder:
import ProjectTeam from "../../components/projects/ProjectTeam"; 

// ... (Icons remain the same) ...
const ArchiveIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
);

const RestoreIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
);

export default function ProjectDetails() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("TASKS");

    useEffect(() => {
        fetchProject();
    }, [projectId]);

    const fetchProject = async () => {
        try {
            const res = await api.get(`/projects/${projectId}`);
            setProject(res.data);
        } catch (err) {
            console.error("Failed to load project", err);
        } finally {
            setLoading(false);
        }
    };

    const handleArchiveToggle = async () => {
        try {
            const endpoint = project.is_archived 
                ? `/projects/${projectId}/unarchive` 
                : `/projects/${projectId}/archive`;
            await api.patch(endpoint);
            navigate('/dashboard');
        } catch (err) {
            alert(err.response?.data?.message || "Action failed");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading project...</div>;
    if (!project) return <div className="p-8 text-center text-red-500">Project not found</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        {project.name}
                        {project.is_archived && (
                            <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-200">
                                ARCHIVED
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-500 mt-1 max-w-2xl text-sm">
                        {project.description || "No description provided."}
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleArchiveToggle}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all text-sm font-medium shadow-sm ${
                            project.is_archived
                                ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        {project.is_archived ? (
                            <><RestoreIcon /> Restore Project</>
                        ) : (
                            <><ArchiveIcon /> Archive Project</>
                        )}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 px-8">
                <div className="flex gap-8">
                    <Tab label="Tasks" active={activeTab === "TASKS"} onClick={() => setActiveTab("TASKS")} />
                    <Tab label="Team Members" active={activeTab === "TEAM"} onClick={() => setActiveTab("TEAM")} />
                    <Tab label="Activity" active={activeTab === "ACTIVITY"} onClick={() => setActiveTab("ACTIVITY")} />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
                {activeTab === "TASKS" && <TaskBoard projectId={projectId} />}
                
                {activeTab === "TEAM" && (
                    <div className="max-w-5xl mx-auto">
                        <ProjectTeam projectId={projectId} />
                    </div>
                )}
                
                {activeTab === "ACTIVITY" && (
                    <div className="max-w-3xl mx-auto h-[600px]">
                        {/* Ensure your AuditLogWidget handles the projectId prop correctly */}
                        <AuditLogWidget projectId={projectId} limit={50} />
                    </div>
                )}
            </div>
        </div>
    );
}

function Tab({ label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`py-4 text-sm font-medium border-b-2 transition-all ${
                active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
        >
            {label}
        </button>
    );
}