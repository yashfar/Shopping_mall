"use client";

import { useEffect, useState } from "react";

type User = {
    id: string;
    email: string;
    role: "USER" | "ADMIN";
    createdAt: string;
};

export default function UserManagementTable() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await fetch("/api/admin/users");

            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }

            const data = await response.json();
            setUsers(data.users);
        } catch (err) {
            setError("Failed to load users");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Delete user
    const handleDelete = async (id: string, email: string) => {
        if (!confirm(`Are you sure you want to delete user: ${email}?`)) {
            return;
        }

        try {
            setUpdatingId(id);
            const response = await fetch(`/api/admin/users/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete user");
            }

            // Refresh users list
            await fetchUsers();
        } catch (err: any) {
            alert(err.message || "Failed to delete user");
        } finally {
            setUpdatingId(null);
        }
    };

    // Update user role
    const handleRoleChange = async (id: string, newRole: "USER" | "ADMIN") => {
        try {
            setUpdatingId(id);
            const response = await fetch(`/api/admin/users/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ role: newRole }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update role");
            }

            // Refresh users list
            await fetchUsers();
        } catch (err: any) {
            alert(err.message || "Failed to update role");
        } finally {
            setUpdatingId(null);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-[#C8102E]/20 border-t-[#C8102E] rounded-full animate-spin" />
                <p className="text-[#A9A9A9] font-semibold tracking-tight">Accessing user directory...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-[#C8102E]/20 p-8 rounded-2xl text-center max-w-lg mx-auto">
                <p className="text-[#C8102E] font-black mb-4">{error}</p>
                <button
                    onClick={fetchUsers}
                    className="px-6 py-2 bg-[#C8102E] text-white font-bold rounded-xl hover:bg-[#A90D27] transition-all"
                >
                    Attempt Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight">Active Users ({users.length})</h2>
                <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#A9A9A9] rounded-xl hover:border-[#1A1A1A] text-[#1A1A1A] font-bold transition-all shadow-sm active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Refresh Directory
                </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Identifier</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className={`group hover:bg-gray-50/50 transition-colors ${updatingId === user.id ? "opacity-50 pointer-events-none" : ""}`}
                                >
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                            #{user.id.substring(0, 8)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) =>
                                                handleRoleChange(user.id, e.target.value as "USER" | "ADMIN")
                                            }
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all cursor-pointer ${user.role === "ADMIN"
                                                ? "bg-red-50 text-[#C8102E] border-red-100 focus:ring-red-200"
                                                : "bg-gray-50 text-gray-700 border-gray-200 focus:ring-gray-200"
                                                }`}
                                        >
                                            <option value="USER">User</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(user.id, user.email)}
                                            className="text-gray-400 hover:text-[#C8102E] transition-colors p-2 rounded-full hover:bg-red-50"
                                            title="Delete User"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {users.map((user) => (
                    <div
                        key={user.id}
                        className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 ${updatingId === user.id ? "opacity-60 pointer-events-none" : ""}`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0 pr-4">
                                <h3 className="text-sm font-bold text-gray-900 truncate">{user.email}</h3>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">#{user.id.substring(0, 8)}</p>
                            </div>
                            <select
                                value={user.role}
                                onChange={(e) =>
                                    handleRoleChange(user.id, e.target.value as "USER" | "ADMIN")
                                }
                                className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wide focus:outline-none ${user.role === "ADMIN"
                                    ? "bg-red-50 text-[#C8102E] border-red-100"
                                    : "bg-gray-50 text-gray-600 border-gray-200"
                                    }`}
                            >
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-3">
                            <span className="text-xs text-gray-500">
                                Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <button
                                onClick={() => handleDelete(user.id, user.email)}
                                className="text-red-600 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {users.length === 0 && (
                <div className="py-20 text-center bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-medium text-sm">No users found</p>
                </div>
            )}
        </div>

    );
}
