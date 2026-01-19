import { auth } from "../../../../lib/auth-helper";
import { redirect } from "next/navigation";
import AdminOrderDetails from "./AdminOrderDetails";

export default async function AdminOrderDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div style={{ maxWidth: "1000px", margin: "50px auto", padding: "20px" }}>
            <div style={{ marginBottom: "30px" }}>
                <a
                    href="/admin/orders"
                    style={{
                        color: "#0070f3",
                        textDecoration: "none",
                        fontSize: "14px",
                    }}
                >
                    ← Back to Orders
                </a>
            </div>
            <h1 style={{ marginBottom: "30px" }}>Order Details (Admin)</h1>
            <AdminOrderDetails orderId={params.id} />
        </div>
    );
}
