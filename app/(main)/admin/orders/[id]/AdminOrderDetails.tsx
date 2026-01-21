"use client";

import { useEffect, useState } from "react";

type OrderItem = {
    id: string;
    quantity: number;
    price: number;
    product: {
        id: string;
        title: string;
        description: string | null;
    };
};

type Order = {
    id: string;
    total: number;
    status: string;
    createdAt: string;
    user: {
        id: string;
        email: string;
    };
    items: OrderItem[];
};

export default function AdminOrderDetails({ orderId }: { orderId: string }) {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await fetch(`/api/admin/orders/${orderId}`);
                if (!response.ok) throw new Error("Failed to fetch order");
                const data = await response.json();
                setOrder(data.order);
            } catch (err: any) {
                setError(err.message || "Failed to load order");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    if (loading) {
        return <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>;
    }

    if (error) {
        return (
            <div
                style={{
                    backgroundColor: "#ffe6e6",
                    padding: "20px",
                    borderRadius: "8px",
                    color: "#dc2626",
                }}
            >
                {error}
            </div>
        );
    }

    if (!order) {
        return <div>Order not found</div>;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING":
                return "#fbbf24";
            case "PAID":
                return "#10b981";
            case "SHIPPED":
                return "#3b82f6";
            case "COMPLETED":
                return "#059669";
            case "CANCELED":
                return "#ef4444";
            default:
                return "#6b7280";
        }
    };

    return (
        <div>
            {/* Order & Customer Info */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    marginBottom: "24px",
                }}
            >
                <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Order Information</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div>
                        <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Order ID</div>
                        <div style={{ fontFamily: "monospace", fontSize: "14px" }}>{order.id}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Status</div>
                        <span
                            style={{
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "600",
                                backgroundColor: `${getStatusColor(order.status)}20`,
                                color: getStatusColor(order.status),
                            }}
                        >
                            {order.status}
                        </span>
                    </div>
                    <div>
                        <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Customer</div>
                        <div>{order.user.email}</div>
                        <div style={{ fontSize: "12px", color: "#666", fontFamily: "monospace" }}>
                            ID: {order.user.id}
                        </div>
                    </div>
                    <div>
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
            </div>

            {/* Order Items */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
            >
                <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Order Items</h2>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                            <th style={{ padding: "12px", textAlign: "left" }}>Product</th>
                            <th style={{ padding: "12px", textAlign: "center" }}>Quantity</th>
                            <th style={{ padding: "12px", textAlign: "right" }}>Price (at purchase)</th>
                            <th style={{ padding: "12px", textAlign: "right" }}>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item) => (
                            <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: "12px" }}>
                                    <div style={{ fontWeight: "600" }}>{item.product.title}</div>
                                    {item.product.description && (
                                        <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                                            {item.product.description}
                                        </div>
                                    )}
                                    <div style={{ fontSize: "12px", color: "#999", marginTop: "4px", fontFamily: "monospace" }}>
                                        Product ID: {item.product.id}
                                    </div>
                                </td>
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
                                Total:
                            </td>
                            <td style={{ padding: "16px", textAlign: "right", fontSize: "20px", fontWeight: "700", color: "#0070f3" }}>
                                ${(order.total / 100).toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
