import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import UserManagementTable from "./UserManagementTable";

export default async function AdminPage() {
    const session = await auth();

    // Check if user is logged in
    if (!session) {
        redirect("/login");
    }

    // Check if user has ADMIN role
    if (session.user.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div style={{ maxWidth: "1200px", margin: "50px auto", padding: "20px" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "30px",
                }}
            >
                <h1 style={{ margin: 0 }}>Admin Panel - User Management</h1>
                <div style={{ fontSize: "14px", color: "#666" }}>
                    Logged in as: <strong>{session.user.email}</strong> (
                    {session.user.role})
                </div>
            </div>

            <div
                style={{
                    backgroundColor: "#e3f2fd",
                    padding: "15px",
                    borderRadius: "8px",
                    marginBottom: "30px",
                    border: "1px solid #2196f3",
                }}
            >
                <p style={{ margin: 0, fontSize: "14px" }}>
                    ℹ️ <strong>Admin Panel:</strong> Manage all users, update roles, and
                    delete accounts. Changes take effect immediately.
                </p>
            </div>

            <UserManagementTable />
        </div>
    );
}
