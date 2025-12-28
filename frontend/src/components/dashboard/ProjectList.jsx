import { Link } from "react-router-dom";

export default function ProjectList({ projects }) {
    if (projects.length === 0) {
        return <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">No projects found.</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
                <Link 
                    to={`/projects/${project.id}`} 
                    key={project.id}
                    className="block bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:border-blue-400 group"
                >
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 truncate">
                            {project.name}
                        </h3>
                        <span className={`w-2.5 h-2.5 rounded-full ${project.is_archived ? 'bg-gray-300' : 'bg-green-500'}`}></span>
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
    );
}