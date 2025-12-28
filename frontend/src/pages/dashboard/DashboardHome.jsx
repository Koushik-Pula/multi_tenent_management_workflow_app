import { useAuth } from "../../auth/AuthContext";
import AdminDashboard from "./AdminDashboard";
import MemberDashboard from "./MemberDashboard";

export default function DashboardHome() {
    const { user } = useAuth();

    if (user?.role === "ADMIN") {
        return <AdminDashboard />;
    }

    return <MemberDashboard />;
}