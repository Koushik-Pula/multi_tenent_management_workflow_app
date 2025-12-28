import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const res = await api.get("/auth/me");
            setUser(res.data);
        } catch (err) {
            // If the fetch fails (and the interceptor couldn't fix it), 
            // only then do we clear the user.
            setUser(null);
            throw err; // Re-throw so restoreSession handles the cleanup
        }
    };

    useEffect(() => {
        const restoreSession = async () => {
            const accessToken = localStorage.getItem("accessToken");
            const refreshToken = localStorage.getItem("refreshToken");

            // FIX: Only give up if BOTH tokens are missing
            if (!accessToken && !refreshToken) {
                setLoading(false);
                return;
            }

            try {
                // We attempt to fetch the user. 
                // If accessToken is missing/expired, the Axios interceptor 
                // will catch the 401, refresh the token, and retry this request.
                await fetchUser();
            } catch (err) {
                console.error("Session restoration failed:", err);
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

        await fetchUser();
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem("refreshToken");

        try {
            // Optional: Call backend to delete refresh token from DB
            await api.post("/auth/logout", { refreshToken });
        } catch (err) {
            console.error("Logout failed", err);
        }

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            logout, 
            loading,
            refreshUser: fetchUser 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);