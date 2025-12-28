import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function Topbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const getInitials = (name) => {
        return name
            ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
            : "U";
    };

    const displayName = user?.name || user?.email?.split("@")[0] || "User";

    const getPageTitle = () => {
        switch (location.pathname) {
            case "/": return "Dashboard";
            case "/users": return "Employees";
            case "/profile": return "My Profile";
            default: return "Dashboard";
        }
    };

    return (
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20 flex items-center justify-between px-6 transition-all duration-300">
            
            <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
                    {getPageTitle()}
                </h2>
            </div>

            <div className="flex items-center gap-5">
                
                <Link 
                    to="/profile" 
                    className="group flex items-center gap-3 pl-3 pr-1 py-1 rounded-full border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all duration-200 ease-in-out"
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                            {displayName}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            {user?.role}
                        </p>
                    </div>

                    <div className="relative">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center ring-2 ring-transparent group-hover:ring-blue-100 transition-all shadow-sm">
                            {user?.avatar_url ? (
                                <img 
                                    src={user.avatar_url} 
                                    alt="Avatar" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.classList.remove('hidden');
                                    }}
                                />
                            ) : null}
                            
                            <div className={`w-full h-full flex items-center justify-center bg-blue-600 text-white text-xs font-bold ${user?.avatar_url ? 'hidden' : 'flex'}`}>
                                {getInitials(displayName)}
                            </div>
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                </Link>

                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                <button
                    onClick={logout}
                    className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                    title="Logout"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                </button>
            </div>
        </header>
    );
}