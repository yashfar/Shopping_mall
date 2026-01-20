"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    createdAt: string;
    items: OrderItem[];
};

export default function SuccessContent({ orderId }: { orderId: string }) {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await fetch(`/api/orders/${orderId}`);
                if (!response.ok) throw new Error("Failed to fetch order");
                const data = await response.json();
                setOrder(data.order);
            } catch (error) {
                console.error("Error fetching order:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    if (loading) {
        return <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>;
    }

    if (!order) {
        return (
            <div style={{ textAlign: "center", padding: "40px" }}>
                <p>Order not found</p>
                <Link href="/orders" style={{ color: "#0070f3" }}>
                    View all orders
                </Link>
            </div>
        );
    }

    return (
        <div>
            {/* Success Message */}
            <div
                style={{
                    backgroundColor: "#d1fae5",
                    padding: "24px",
                    borderRadius: "8px",
                    marginBottom: "30px",
                    border: "1px solid #10b981",
                    textAlign: "center",
                }}
            >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
                <h1 style={{ margin: "0 0 12px 0", color: "#059669" }}>Payment Successful!</h1>
                <p style={{ margin: 0, color: "#047857" }}>
                    Thank you for your purchase. Your order has been confirmed.
                </p>
            </div>

            {/* Order Details */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    marginBottom: "24px",
                }}
            >
                <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Order Details</h2>

                <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Order ID</div>
                    <div style={{ fontFamily: "monospace", fontSize: "14px" }}>{order.id}</div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Status</div>
                    <span
                        style={{
                            padding: "4px 12px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: "#d1fae5",
                            color: "#059669",
                        }}
                    >
                        {order.status}
                    </span>
                </div>

                <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Order Date</div>
                    <div>
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    marginBottom: "24px",
                }}
            >
                <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Items Purchased</h2>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                            <th style={{ padding: "12px", textAlign: "left" }}>Product</th>
                            <th style={{ padding: "12px", textAlign: "center" }}>Quantity</th>
                            <th style={{ padding: "12px", textAlign: "right" }}>Price</th>
                            <th style={{ padding: "12px", textAlign: "right" }}>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item) => (
                            <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: "12px" }}>{item.product.title}</td>
                                <td style={{ padding: "12px", textAlign: "center" }}>{item.quantity}</td>
                                <td style={{ padding: "12px", textAlign: "right" }}>
                                    ${(item.price / 100).toFixed(2)}
                                </td>
                                <td style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>
                                    ${((item.price * item.quantity) / 100).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ borderTop: "2px solid #ddd" }}>
                            <td colSpan={3} style={{ padding: "16px", textAlign: "right", fontWeight: "700" }}>
                                Total Paid:
                            </td>
                            <td
                                style={{
                                    padding: "16px",
                                    textAlign: "right",
                                    fontSize: "20px",
                                    fontWeight: "700",
                                    color: "#10b981",
                                }}
                            >
                                ${(order.total / 100).toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
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
                    View All Orders
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
