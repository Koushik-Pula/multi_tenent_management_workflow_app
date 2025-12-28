import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ children }) {
    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
                <Topbar />
                <main className="p-6 bg-gray-100 flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
