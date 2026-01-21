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
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await fetch("/api/cart");
                if (!response.ok) throw new Error("Failed to fetch cart");
                const data = await response.json();
                setCart(data.cart);

                // Redirect to cart if empty (only on initial load)
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    const createOrder = async () => {
        try {
            setCreating(true);
            const response = await fetch("/api/orders/create", {
                method: "POST",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create order");
            }

            const data = await response.json();

            // Redirect to payment page
            router.push(`/checkout?orderId=${data.orderId}`);
        } catch (error: any) {
            console.error("Error creating order:", error);
            alert(error.message || "Failed to create order");
            setCreating(false); // Only reset on error
        }
        // Don't reset creating on success - let the redirect happen
    };


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
                    ℹ️ <strong>Ready to place order:</strong> Click "Place Order" to confirm your purchase.
                    You will be redirected to payment in the next step.
                </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
                <button
                    onClick={() => router.push("/cart")}
                    disabled={creating}
                    style={{
                        flex: 1,
                        padding: "14px",
                        backgroundColor: "#f5f5f5",
                        color: "#333",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        cursor: creating ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "16px",
                        opacity: creating ? 0.5 : 1,
                    }}
                >
                    ← Back to Cart
                </button>
                <button
                    onClick={createOrder}
                    disabled={creating}
                    style={{
                        flex: 1,
                        padding: "14px",
                        backgroundColor: creating ? "#ccc" : "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: creating ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "16px",
                    }}
                >
                    {creating ? "Creating Order..." : "Place Order"}
                </button>
            </div>
        </div>
    );
}
