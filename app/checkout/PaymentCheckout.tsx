"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type OrderItem = {
    id: string;
    quantity: number;
    price: number;
    product: {
        title: string;
    };
};

type Order = {
    id: string;
    total: number;
    status: string;
    items: OrderItem[];
};

export default function PaymentCheckout({ orderId }: { orderId: string }) {
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await fetch(`/api/orders/${orderId}`);
                if (!response.ok) throw new Error("Failed to fetch order");
                const data = await response.json();
                setOrder(data.order);

                // If order is not pending, redirect
                if (data.order.status !== "PENDING") {
                    router.push(`/orders/${orderId}`);
                }
            } catch (error) {
                console.error("Error fetching order:", error);
                router.push("/orders");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, router]);

    const handlePayment = async () => {
        try {
            setPaying(true);
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create checkout session");
            }

            const data = await response.json();

            // Redirect to Stripe Checkout
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error: any) {
            console.error("Error creating checkout session:", error);
            alert(error.message || "Failed to proceed to payment");
            setPaying(false);
        }
    };

    if (loading) {
        return <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>;
    }

    if (!order) {
        return null;
    }

    return (
        <div>
            {/* Order Summary */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    marginBottom: "24px",
                }}
            >
                <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Order Summary</h2>

                <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Order ID</div>
                    <div style={{ fontFamily: "monospace", fontSize: "14px" }}>{order.id}</div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                            <th style={{ padding: "12px", textAlign: "left" }}>Product</th>
                            <th style={{ padding: "12px", textAlign: "center" }}>Qty</th>
                            <th style={{ padding: "12px", textAlign: "right" }}>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item) => (
                            <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: "12px" }}>{item.product.title}</td>
                                <td style={{ padding: "12px", textAlign: "center" }}>{item.quantity}</td>
                                <td style={{ padding: "12px", textAlign: "right" }}>
                                    ${((item.price * item.quantity) / 100).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ borderTop: "2px solid #ddd" }}>
                            <td colSpan={2} style={{ padding: "16px", textAlign: "right", fontWeight: "700" }}>
                                Total:
                            </td>
                            <td
                                style={{
                                    padding: "16px",
                                    textAlign: "right",
                                    fontSize: "24px",
                                    fontWeight: "700",
                                    color: "#0070f3",
                                }}
                            >
                                ${(order.total / 100).toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Payment Info */}
            <div
                style={{
                    backgroundColor: "#e3f2fd",
                    padding: "20px",
                    borderRadius: "8px",
                    marginBottom: "24px",
                    border: "1px solid #2196f3",
                }}
            >
                <p style={{ margin: 0, fontSize: "14px" }}>
                    🔒 <strong>Secure Payment:</strong> You will be redirected to Stripe's secure payment page.
                    We accept all major credit cards.
                </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
                <button
                    onClick={() => router.push("/orders")}
                    disabled={paying}
                    style={{
                        flex: 1,
                        padding: "14px",
                        backgroundColor: "#f5f5f5",
                        color: "#333",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        cursor: paying ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "16px",
                        opacity: paying ? 0.5 : 1,
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={handlePayment}
                    disabled={paying}
                    style={{
                        flex: 2,
                        padding: "14px",
                        backgroundColor: paying ? "#ccc" : "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: paying ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "16px",
                    }}
                >
                    {paying ? "Redirecting to Payment..." : "Pay Now"}
                </button>
            </div>
        </div>
    );
}
