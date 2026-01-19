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
            <div style={{ textAlign: "center", padding: "40px" }}>
                <p>Loading users...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    backgroundColor: "#ffe6e6",
                    padding: "20px",
                    borderRadius: "8px",
                    color: "red",
                }}
            >
                <p>{error}</p>
                <button
                    onClick={fetchUsers}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: "#0070f3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                }}
            >
                <h2 style={{ margin: 0 }}>Users ({users.length})</h2>
                <button
                    onClick={fetchUsers}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: "#f5f5f5",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        cursor: "pointer",
                    }}
                >
                    🔄 Refresh
                </button>
            </div>

            <div style={{ overflowX: "auto" }}>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        backgroundColor: "white",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                >
                    <thead>
                        <tr style={{ backgroundColor: "#f5f5f5" }}>
                            <th
                                style={{
                                    padding: "12px",
                                    textAlign: "left",
                                    borderBottom: "2px solid #ddd",
                                    fontWeight: "600",
                                }}
                            >
                                ID
                            </th>
                            <th
                                style={{
                                    padding: "12px",
                                    textAlign: "left",
                                    borderBottom: "2px solid #ddd",
                                    fontWeight: "600",
                                }}
                            >
                                Email
                            </th>
                            <th
                                style={{
                                    padding: "12px",
                                    textAlign: "left",
                                    borderBottom: "2px solid #ddd",
                                    fontWeight: "600",
                                }}
                            >
                                Role
                            </th>
                            <th
                                style={{
                                    padding: "12px",
                                    textAlign: "left",
                                    borderBottom: "2px solid #ddd",
                                    fontWeight: "600",
                                }}
                            >
                                Created At
                            </th>
                            <th
                                style={{
                                    padding: "12px",
                                    textAlign: "center",
                                    borderBottom: "2px solid #ddd",
                                    fontWeight: "600",
                                }}
                            >
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr
                                key={user.id}
                                style={{
                                    borderBottom: "1px solid #eee",
                                    opacity: updatingId === user.id ? 0.5 : 1,
                                }}
                            >
                                <td
                                    style={{
                                        padding: "12px",
                                        fontSize: "12px",
                                        fontFamily: "monospace",
                                        color: "#666",
                                    }}
                                >
                                    {user.id.substring(0, 8)}...
                                </td>
                                <td style={{ padding: "12px" }}>{user.email}</td>
                                <td style={{ padding: "12px" }}>
                                    <select
                                        value={user.role}
                                        onChange={(e) =>
                                            handleRoleChange(user.id, e.target.value as "USER" | "ADMIN")
                                        }
                                        disabled={updatingId === user.id}
                                        style={{
                                            padding: "6px 10px",
                                            borderRadius: "4px",
                                            border: "1px solid #ccc",
                                            backgroundColor:
                                                user.role === "ADMIN" ? "#fff3cd" : "#e3f2fd",
                                            cursor: "pointer",
                                            fontWeight: user.role === "ADMIN" ? "600" : "normal",
                                        }}
                                    >
                                        <option value="USER">USER</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </td>
                                <td style={{ padding: "12px", fontSize: "14px", color: "#666" }}>
                                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </td>
                                <td style={{ padding: "12px", textAlign: "center" }}>
                                    <button
                                        onClick={() => handleDelete(user.id, user.email)}
                                        disabled={updatingId === user.id}
                                        style={{
                                            padding: "6px 12px",
                                            backgroundColor: "#dc2626",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: updatingId === user.id ? "not-allowed" : "pointer",
                                            fontSize: "14px",
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {users.length === 0 && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "40px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "8px",
                        marginTop: "20px",
                    }}
                >
                    <p style={{ color: "#666" }}>No users found</p>
                </div>
            )}
        </div>
    );
}
