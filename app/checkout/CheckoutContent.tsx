"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
    id: string;
    quantity: number;
    product: {
        id: string;
        title: string;
        price: number;
    };
};

type Cart = {
    id: string;
    items: CartItem[];
};

export default function CheckoutContent() {
    const router = useRouter();
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await fetch("/api/cart");
                if (!response.ok) throw new Error("Failed to fetch cart");
                const data = await response.json();
                setCart(data.cart);

                // Redirect to cart if empty
                if (!data.cart || data.cart.items.length === 0) {
                    router.push("/cart");
                }
            } catch (error) {
                console.error("Error fetching cart:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, [router]);

    if (loading) {
        return <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>;
    }

    if (!cart || cart.items.length === 0) {
        return null; // Will redirect
    }

    const total = cart.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

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

                <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px", marginBottom: "16px" }}>
                    {cart.items.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "12px",
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: "600" }}>{item.product.title}</div>
                                <div style={{ fontSize: "14px", color: "#666" }}>
                                    Quantity: {item.quantity}
                                </div>
                            </div>
                            <div style={{ fontWeight: "600" }}>
                                ${((item.product.price * item.quantity) / 100).toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "20px",
                        fontWeight: "700",
                    }}
                >
                    <span>Total</span>
                    <span style={{ color: "#0070f3" }}>${(total / 100).toFixed(2)}</span>
                </div>
            </div>

            {/* Checkout Info */}
            <div
                style={{
                    backgroundColor: "#fff3cd",
                    padding: "20px",
                    borderRadius: "8px",
                    marginBottom: "24px",
                    border: "1px solid #ffc107",
                }}
            >
                <p style={{ margin: 0, fontSize: "14px" }}>
                    ℹ️ <strong>Note:</strong> This is a checkout preview. Order creation and payment
                    integration will be implemented in Step 11.
                </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
                <button
                    onClick={() => router.push("/cart")}
                    style={{
                        flex: 1,
                        padding: "14px",
                        backgroundColor: "#f5f5f5",
                        color: "#333",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "16px",
                    }}
                >
                    ← Back to Cart
                </button>
                <button
                    onClick={() => alert("Order creation will be implemented in Step 11")}
                    style={{
                        flex: 1,
                        padding: "14px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "16px",
                    }}
                >
                    Confirm and Continue
                </button>
            </div>
        </div>
    );
}
