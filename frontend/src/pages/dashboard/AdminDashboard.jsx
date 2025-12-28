import { useEffect, useState } from "react";
import api from "../../api/axios";
import AuditLogWidget from "../../components/dashboard/AuditLogWidget";
import ProjectList from "../../components/dashboard/ProjectList";
import CreateProjectModal from "../../components/dashboard/CreateProjectModal";

export default function AdminDashboard() {
    const [projects, setProjects] = useState([]);
    
    // Initialize stats with 0 to prevent "undefined" errors
    const [stats, setStats] = useState({ 
        employees: 0, 
        projects: 0,
        activeTasks: 0 
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Fetch Projects and Stats in parallel for speed
            const [projRes, statsRes] = await Promise.all([
                api.get("/projects?limit=6"), // Get the 6 most recent projects
                api.get("/users/stats")       // Get the accurate counts from the backend
            ]);
            
            setProjects(projRes.data.data);
            setStats(statsRes.data); // Updates employees, projects, and activeTasks
        } catch (err) {
            console.error("Dashboard data failed:", err);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1: Active Projects */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500 font-medium">Active Projects</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.projects}</h3>
                </div>

                {/* Card 2: Total Employees (Fixed) */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500 font-medium">Total Employees</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.employees}</h3>
                </div>

                {/* Card 3: Pending Tasks (Dynamic) */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
                    <p className="text-blue-100 font-medium">Pending Tasks</p>
                    <h3 className="text-2xl font-bold mt-2 flex items-center gap-2">
                        {stats.activeTasks}
                        <span className="text-sm font-normal text-blue-200 ml-1">tasks across org</span>
                    </h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Projects Section (2/3 width) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
                        
                        {/* Create Project Button */}
                        <div className="flex items-center gap-3">
                            <CreateProjectModal onProjectCreated={loadDashboardData} />
                        </div>
                    </div>
                    
                    <ProjectList projects={projects} />
                </div>

                {/* Audit Log (1/3 width) */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">Activity Log</h2>
                    </div>
                    <div className="h-[500px]">
                        {/* Passing null means "Fetch Organization-wide logs" */}
                        <AuditLogWidget projectId={null} limit={10} />
                    </div>
                </div>
            </div>
        </div>
    );
}