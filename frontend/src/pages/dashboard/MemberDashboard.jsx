import { useEffect, useState } from "react";
import api from "../../api/axios";
import AuditLogWidget from "../../components/dashboard/AuditLogWidget";
import ProjectList from "../../components/dashboard/ProjectList";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function MemberDashboard() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        api.get("/projects").then(res => {
            setProjects(res.data.data); 
        });
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(" ")[0] || "User"}!</h1>
                    <p className="text-gray-500 mt-1">Here is what is happening in your organization today.</p>
                </div>
                <button onClick={() => navigate('/my-tasks')} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                    View My Tasks
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Projects</h2>
                    <ProjectList projects={projects} />
                </div>

                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                    <div className="h-[500px]">
                        <AuditLogWidget limit={10} /> 
                    </div>
                </div>
            </div>
        </div>
    );
}