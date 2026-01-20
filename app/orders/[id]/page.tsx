import { auth } from "../../../lib/auth-helper";
import { redirect } from "next/navigation";
import OrderDetails from "./OrderDetails";

export default async function OrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login?callbackUrl=/orders");
    }

    const { id } = await params;

    return (
        <div style={{ maxWidth: "800px", margin: "50px auto", padding: "20px" }}>
            <div style={{ marginBottom: "30px" }}>
                <a
                    href="/orders"
                    style={{
                        color: "#0070f3",
                        textDecoration: "none",
                        fontSize: "14px",
                    }}
                >
                    ← Back to Orders
                </a>
            </div>
            <h1 style={{ marginBottom: "30px" }}>Order Details</h1>
            <OrderDetails orderId={id} />
        </div>
    );
}
