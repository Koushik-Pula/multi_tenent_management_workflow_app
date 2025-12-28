import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import DashboardLayout from "./components/dashboard/DashboardLayout";

import Dashboard from "./pages/Dashboard";

import UsersPage from "./pages/users/UsersPage";
import ProfilePage from "./pages/profile/ProfilePage";

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    <Route
                        element={
                            <ProtectedRoute>
                                <DashboardLayout>
                                    <Outlet />
                                </DashboardLayout>
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;