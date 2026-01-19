import { auth } from "../../../lib/auth-helper";
import { redirect } from "next/navigation";
import ProductManagement from "./ProductManagement";

export default async function AdminProductsPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div style={{ maxWidth: "1400px", margin: "50px auto", padding: "20px" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "30px",
                }}
            >
                <h1 style={{ margin: 0 }}>Product Management</h1>
                <div style={{ fontSize: "14px", color: "#666" }}>
                    <a href="/admin" style={{ color: "#0070f3", textDecoration: "none" }}>
                        ← Back to Admin Panel
                    </a>
                </div>
            </div>

            <ProductManagement />
        </div>
    );
}
