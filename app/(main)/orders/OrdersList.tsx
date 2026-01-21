"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
    id: string;
    total: number;
    status: string;
    createdAt: string;
};

export default function OrdersList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch("/api/orders");
                if (!response.ok) throw new Error("Failed to fetch orders");
                const data = await response.json();
                setOrders(data.orders);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    if (loading) {
        return <div style={{ textAlign: "center", padding: "40px" }}>Loading orders...</div>;
    }

    if (orders.length === 0) {
        return (
            <div
                style={{
                    textAlign: "center",
                    padding: "60px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                }}
            >
                <h2 style={{ marginBottom: "20px", color: "#666" }}>No orders yet</h2>
                <a
                    href="/products"
                    style={{
                        display: "inline-block",
                        padding: "12px 24px",
                        backgroundColor: "#0070f3",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "6px",
                        fontWeight: "600",
                    }}
                >
                    Start Shopping
                </a>
            </div>
        );
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
        <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                        <th style={{ padding: "16px", textAlign: "left" }}>Order ID</th>
                        <th style={{ padding: "16px", textAlign: "right" }}>Total</th>
                        <th style={{ padding: "16px", textAlign: "center" }}>Status</th>
                        <th style={{ padding: "16px", textAlign: "left" }}>Date</th>
                        <th style={{ padding: "16px", textAlign: "center" }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "16px", fontFamily: "monospace", fontSize: "14px" }}>
                                {order.id.substring(0, 12)}...
                            </td>
                            <td style={{ padding: "16px", textAlign: "right", fontWeight: "700", color: "#0070f3" }}>
                                ${(order.total / 100).toFixed(2)}
                            </td>
                            <td style={{ padding: "16px", textAlign: "center" }}>
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
                            </td>
                            <td style={{ padding: "16px", fontSize: "14px", color: "#666" }}>
                                {new Date(order.createdAt).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </td>
                            <td style={{ padding: "16px", textAlign: "center" }}>
                                <Link
                                    href={`/orders/${order.id}`}
                                    style={{
                                        padding: "8px 16px",
                                        backgroundColor: "#0070f3",
                                        color: "white",
                                        textDecoration: "none",
                                        borderRadius: "4px",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                    }}
                                >
                                    View Details
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
