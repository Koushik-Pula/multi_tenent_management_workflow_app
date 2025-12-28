import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🔁 Restore session on app load
    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await api.get("/auth/me");
                setUser(res.data);
            } catch (err) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (email, password) => {
        const res = await api.post("/auth/login", { email, password });

        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);

        const me = await api.get("/auth/me");
        setUser(me.data);
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem("refreshToken");

        try {
            await api.post("/auth/logout", { refreshToken });
        } catch {}

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
