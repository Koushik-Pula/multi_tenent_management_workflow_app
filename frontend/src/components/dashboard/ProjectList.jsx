import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const ArchiveIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
);

const RestoreIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
);

export default function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [status, setStatus] = useState('active');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProjects();
    }, [status]);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/projects?status=${status}`);
            setProjects(res.data.data);
        } catch (err) {
            console.error("Failed to load projects", err);
        } finally {
            setLoading(false);
        }
    };

    const handleArchiveToggle = async (e, projectId) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const endpoint = status === 'active' 
                ? `/projects/${projectId}/archive` 
                : `/projects/${projectId}/unarchive`;
            await api.patch(endpoint);
            loadProjects();
        } catch (err) {
            alert(err.response?.data?.message || "Operation failed");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex border-b border-gray-200">
                <button 
                    onClick={() => setStatus('active')}
                    className={`pb-3 px-6 text-sm font-medium transition-colors ${status === 'active' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Active Projects
                </button>
                <button 
                    onClick={() => setStatus('archived')}
                    className={`pb-3 px-6 text-sm font-medium transition-colors ${status === 'archived' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Archived
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : projects.length === 0 ? (
                <div className="p-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                    No {status} projects found.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Link 
                            to={`/projects/${project.id}`} 
                            key={project.id}
                            className="block bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:border-blue-400 group relative"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 truncate max-w-[80%]">
                                    {project.name}
                                </h3>
                                <button
                                    onClick={(e) => handleArchiveToggle(e, project.id)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    title={status === 'active' ? "Archive" : "Restore"}
                                >
                                    {status === 'active' ? <ArchiveIcon /> : <RestoreIcon />}
                                </button>
                            </div>
                            
                            <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">
                                {project.description || "No description provided."}
                            </p>

                            <div className="flex items-center text-xs text-gray-400 border-t pt-4">
                                <span className="truncate">Created by {project.created_by_name}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}