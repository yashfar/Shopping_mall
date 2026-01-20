import { auth } from "../../lib/auth-helper";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CheckoutCancelPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    return (
        <div style={{ maxWidth: "600px", margin: "50px auto", padding: "20px" }}>
            {/* Cancel Message */}
            <div
                style={{
                    backgroundColor: "#fee2e2",
                    padding: "24px",
                    borderRadius: "8px",
                    marginBottom: "30px",
                    border: "1px solid #ef4444",
                    textAlign: "center",
                }}
            >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>✕</div>
                <h1 style={{ margin: "0 0 12px 0", color: "#dc2626" }}>Payment Canceled</h1>
                <p style={{ margin: 0, color: "#991b1b" }}>
                    Your payment was canceled. No charges were made.
                </p>
            </div>

            {/* Information */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    marginBottom: "24px",
                }}
            >
                <h2 style={{ marginTop: 0, marginBottom: "16px" }}>What happened?</h2>
                <p style={{ color: "#666", lineHeight: "1.6" }}>
                    You canceled the payment process. Your order is still pending and waiting for payment.
                    You can try again anytime from your orders page.
                </p>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <Link
                    href="/orders"
                    style={{
                        padding: "12px 24px",
                        backgroundColor: "#0070f3",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "6px",
                        fontWeight: "600",
                    }}
                >
                    View My Orders
                </Link>
                <Link
                    href="/products"
                    style={{
                        padding: "12px 24px",
                        backgroundColor: "#f5f5f5",
                        color: "#333",
                        textDecoration: "none",
                        borderRadius: "6px",
                        fontWeight: "600",
                        border: "1px solid #ccc",
                    }}
                >
                    Continue Shopping
                </Link>
            </div>
        </div>
    );
}
