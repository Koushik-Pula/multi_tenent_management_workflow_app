import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import DashboardLayout from "./components/dashboard/DashboardLayout";

import DashboardHome from "./pages/dashboard/DashboardHome";
import UsersPage from "./pages/users/UsersPage";
import ProfilePage from "./pages/profile/ProfilePage";
import AcceptInvite from "./pages/AcceptInvite";

import ProjectDetails from "./pages/projects/ProjectDetails";

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/accept-invite" element={<AcceptInvite />} />

                    <Route
                        element={
                            <ProtectedRoute>
                                <DashboardLayout>
                                    <Outlet />
                                </DashboardLayout>
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/" element={<DashboardHome />} />
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/projects/:projectId" element={<ProjectDetails />} />
                        
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;