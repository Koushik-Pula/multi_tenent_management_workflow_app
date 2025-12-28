import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/axios";

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [data, setData] = useState(null);
    const [form, setForm] = useState({
        name: "",
        job_title: "",
        timezone: "",
        avatar_url: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        loadProfile();
    }, []);

    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage({ type: "", text: "" });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const loadProfile = async () => {
        try {
            const res = await api.get("/users/me/profile");
            setData(res.data);
            setForm(res.data);
        } catch (err) {
            setMessage({ type: "error", text: "Failed to load profile data" });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleCancel = () => {
        setForm(data);
        setIsEditing(false);
        setMessage({ type: "", text: "" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: "" });

        try {
            await api.patch("/users/me/profile", form);
            await refreshUser();
            setData(form);
            setIsEditing(false);
            setMessage({ type: "success", text: "Profile updated successfully" });
        } catch (err) {
            setMessage({ type: "error", text: "Failed to update profile" });
        } finally {
            setSaving(false);
        }
    };

    const getInitials = (name) => {
        return name
            ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
            : "ME";
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                    <p className="text-gray-500 mt-1">Manage your account details.</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition"
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            {message.text && (
                <div className={`p-4 rounded-md mb-6 text-sm font-medium transition-opacity duration-500 ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center text-center">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 ring-4 ring-white shadow-lg flex items-center justify-center mb-4">
                            {form.avatar_url ? (
                                <img
                                    src={form.avatar_url}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.classList.remove('hidden'); }}
                                />
                            ) : null}
                            <div className={`w-full h-full items-center justify-center bg-blue-600 text-white text-3xl font-bold ${form.avatar_url ? 'hidden' : 'flex'}`}>
                                {getInitials(form.name)}
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900">
                            {data.name || "Your Name"}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {data.job_title || "No Job Title"}
                        </p>

                        {isEditing && (
                            <div className="w-full text-left mt-2 animate-fade-in">
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Avatar Image URL</label>
                                <input
                                    type="text"
                                    name="avatar_url"
                                    value={form.avatar_url}
                                    onChange={handleChange}
                                    className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                                    placeholder="https://..."
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <div className="p-6 space-y-6">
                            <div className="border-b pb-4 mb-4">
                                <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                                    <div className="text-gray-900 font-medium px-1">{user?.email}</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                                    {isEditing ? (
                                        <input
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    ) : (
                                        <div className="text-gray-900 text-lg px-1">{data.name || "-"}</div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Job Title</label>
                                        {isEditing ? (
                                            <input
                                                name="job_title"
                                                value={form.job_title}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border-gray-300 border px-4 py-2"
                                            />
                                        ) : (
                                            <div className="text-gray-900 px-1">{data.job_title || "-"}</div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Timezone</label>
                                        {isEditing ? (
                                            <input
                                                name="timezone"
                                                value={form.timezone}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border-gray-300 border px-4 py-2"
                                            />
                                        ) : (
                                            <div className="text-gray-900 px-1">{data.timezone || "-"}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition-all disabled:opacity-70 flex items-center gap-2"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}