import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function Topbar() {
    const { user, logout } = useAuth();

    const getInitials = (name) => {
        return name
            ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
            : "U";
    };

    const displayName = user?.name || user?.email?.split("@")[0] || "User";

    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm z-20 relative">
            <div className="flex-1"></div>

            <div className="flex items-center gap-4">
                <Link 
                    to="/profile" 
                    className="flex items-center gap-3 hover:bg-gray-50 py-1 px-2 rounded-lg transition-colors group"
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                            {displayName}
                        </p>
                        <p className="text-xs text-gray-400 font-medium tracking-wide">
                            {user?.role}
                        </p>
                    </div>

                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center relative ring-2 ring-transparent group-hover:ring-blue-100 transition-all">
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
                        
                        <div className={`w-full h-full items-center justify-center bg-blue-600 text-white text-xs font-bold ${user?.avatar_url ? 'hidden' : 'flex'}`}>
                            {getInitials(displayName)}
                        </div>
                    </div>
                </Link>

                <div className="h-6 w-px bg-gray-200"></div>

                <button
                    onClick={logout}
                    className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors px-2"
                >
                    Logout
                </button>
            </div>
        </header>
    );
}