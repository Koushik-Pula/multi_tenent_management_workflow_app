import { useAuth } from "../../auth/AuthContext";

export default function RoleGate({ allow = [], children }) {
    const { user } = useAuth();
    if (!user) return null;
    if (allow.length && !allow.includes(user.role)) return null;
    return children;
}
