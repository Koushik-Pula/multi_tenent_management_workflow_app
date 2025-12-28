import { Link } from "react-router-dom";
import RoleGate from "../common/RoleGate";

export default function Sidebar() {
    return (
        <aside className="w-64 bg-gray-900 text-white min-h-screen px-6 py-5">
            <h1 className="text-xl font-bold mb-8">SaaS Dashboard</h1>

            <nav className="space-y-3 text-sm">
                <Link to="/" className="block hover:text-blue-400">
                    Dashboard
                </Link>

                <RoleGate allow={["ADMIN"]}>
                    <Link to="/users" className="block hover:text-blue-400">
                        Users
                    </Link>
                </RoleGate>

                <Link
                    to="/profile"
                    className="block hover:text-blue-400"
                >
                    Profile
                </Link>
            </nav>
        </aside>
    );
}
