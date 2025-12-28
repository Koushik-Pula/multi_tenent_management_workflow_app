import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import AuditLogWidget from "../../components/dashboard/AuditLogWidget";
import TaskBoard from "../../components/projects/TaskBoard";
import ProjectTeam from "../../components/projects/ProjectTeam";

export default function ProjectDetails() {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("TASKS");

    useEffect(() => {
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
        fetchProject();
    }, [projectId]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading project...</div>;
    if (!project) return <div className="p-8 text-center text-red-500">Project not found</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]"> {/* Full height minus header */}
            
            {/* --- Project Header --- */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        {project.name}
                        {project.is_archived && (
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                                Archived
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-500 mt-1 max-w-2xl">
                        {project.description || "No description provided."}
                    </p>
                </div>
                
                {/* Manager Actions (Placeholder) */}
                <div className="flex items-center gap-3">
                     {/* We will add "Edit" or "Add Task" buttons here later */}
                </div>
            </div>

            {/* --- Tabs --- */}
            <div className="bg-white border-b border-gray-200 px-8">
                <div className="flex gap-6">
                    <Tab 
                        label="Tasks" 
                        active={activeTab === "TASKS"} 
                        onClick={() => setActiveTab("TASKS")} 
                    />
                    <Tab 
                        label="Team Members" 
                        active={activeTab === "TEAM"} 
                        onClick={() => setActiveTab("TEAM")} 
                    />
                    <Tab 
                        label="Activity" 
                        active={activeTab === "ACTIVITY"} 
                        onClick={() => setActiveTab("ACTIVITY")} 
                    />
                </div>
            </div>

            {/* --- Tab Content Area --- */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
                
                {activeTab === "TASKS" && (
                    <div className="text-center text-gray-500 py-10">
                        {/* We will build the Kanban Board next */}
                        <TaskBoard projectId={projectId} />
                    </div>
                )}

                {activeTab === "TEAM" && (
                     <div className="text-center text-gray-500 py-10">
                        {/* We will build the Member List next */}
                        <ProjectTeam projectId={projectId} />
                     </div>
                )}

                {activeTab === "ACTIVITY" && (
                    <div className="max-w-3xl mx-auto">
                        {/* Reuse the widget we built earlier! */}
                        <AuditLogWidget projectId={projectId} limit={20} />
                    </div>
                )}
            </div>
        </div>
    );
}

// Simple Tab Component
function Tab({ label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
        >
            {label}
        </button>
    );
}