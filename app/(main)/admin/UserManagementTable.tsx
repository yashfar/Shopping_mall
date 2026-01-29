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

            <div className="bg-white rounded-2xl border border-[#A9A9A9] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#FAFAFA] border-b border-[#A9A9A9]/20">
                                <th className="px-8 py-5 text-xs font-black text-[#A9A9A9] uppercase tracking-widest">Identifier</th>
                                <th className="px-8 py-5 text-xs font-black text-[#A9A9A9] uppercase tracking-widest">Account Details</th>
                                <th className="px-8 py-5 text-xs font-black text-[#A9A9A9] uppercase tracking-widest">Permissions</th>
                                <th className="px-8 py-5 text-xs font-black text-[#A9A9A9] uppercase tracking-widest">Registered Date</th>
                                <th className="px-8 py-5 text-xs font-black text-[#A9A9A9] uppercase tracking-widest text-right">Administrative</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#A9A9A9]/10">
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className={`transition-colors hover:bg-red-50/30 ${updatingId === user.id ? "opacity-40" : "opacity-100"}`}
                                >
                                    <td className="px-8 py-6">
                                        <span className="text-xs font-mono font-bold text-[#A9A9A9] bg-[#FAFAFA] px-2 py-1 rounded">
                                            #{user.id.substring(0, 8)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-[#1A1A1A] text-lg">{user.email}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <select
                                            value={user.role}
                                            onChange={(e) =>
                                                handleRoleChange(user.id, e.target.value as "USER" | "ADMIN")
                                            }
                                            disabled={updatingId === user.id}
                                            className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-all cursor-pointer focus:outline-none focus:ring-4 ${user.role === "ADMIN"
                                                ? "bg-red-50 text-[#C8102E] border-[#C8102E]/20"
                                                : "bg-[#FAFAFA] text-[#1A1A1A] border-[#A9A9A9]/20"
                                                }`}
                                        >
                                            <option value="USER">USER</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </td>
                                    <td className="px-8 py-6 text-[#A9A9A9] font-medium text-sm">
                                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => handleDelete(user.id, user.email)}
                                            disabled={updatingId === user.id}
                                            className="px-5 py-2 bg-white border border-[#A9A9A9] text-[#1A1A1A] font-bold rounded-xl hover:bg-[#C8102E] hover:text-white hover:border-[#C8102E] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {users.length === 0 && (
                    <div className="py-20 text-center bg-[#FAFAFA]">
                        <div className="w-16 h-16 bg-[#A9A9A9]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 text-[#A9A9A9]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                        </div>
                        <p className="text-[#A9A9A9] font-black uppercase tracking-widest text-xs">No users found in directory</p>
                    </div>
                )}
            </div>
        </div>
    );
}
