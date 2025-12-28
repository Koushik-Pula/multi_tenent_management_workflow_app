import { Link, useLocation } from "react-router-dom";
import RoleGate from "../common/RoleGate";
import { useAuth } from "../../auth/AuthContext";

export default function Sidebar() {
    const { user } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out">
            
            <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-900/20">
                        {user?.org_name ? user.org_name[0].toUpperCase() : "S"}
                    </div>
                    <h1 className="font-bold text-slate-100 tracking-wide truncate max-w-[140px]" title={user?.org_name}>
                        {user?.org_name || "SaaS Dashboard"}
                    </h1>
                </div>
            </div>

            <nav className="flex-1 px-3 py-6 space-y-1">
                <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Main Menu
                </p>

                <NavItem 
                    to="/" 
                    active={isActive("/")}
                    icon={<HomeIcon />} 
                    label="Dashboard" 
                />

                <RoleGate allow={["ADMIN"]}>
                    <NavItem 
                        to="/users" 
                        active={isActive("/users")}
                        icon={<UsersIcon />} 
                        label="Employees" 
                    />
                </RoleGate>

                <NavItem 
                    to="/profile" 
                    active={isActive("/profile")}
                    icon={<UserIcon />} 
                    label="My Profile" 
                />
            </nav>
        </aside>
    );
}

function NavItem({ to, active, icon, label }) {
    return (
        <Link
            to={to}
            className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${active 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/20 translate-x-1" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1"
                }
            `}
        >
            <span className={`${active ? "text-white" : "text-slate-500 group-hover:text-white"} transition-colors`}>
                {icon}
            </span>
            {label}
        </Link>
    );
}

const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);