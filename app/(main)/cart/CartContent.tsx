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
        stock: number;
    };
};

type Cart = {
    id: string;
    items: CartItem[];
};

export default function CartContent() {
    const router = useRouter();
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [hasAddresses, setHasAddresses] = useState(true);
    const [checkingAddresses, setCheckingAddresses] = useState(true);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/cart");
            if (!response.ok) throw new Error("Failed to fetch cart");
            const data = await response.json();
            setCart(data.cart);
        } catch (error) {
            console.error("Error fetching cart:", error);
        } finally {
            setLoading(false);
        }
    };

    const checkAddresses = async () => {
        try {
            setCheckingAddresses(true);
            const response = await fetch("/api/address/list");
            if (response.ok) {
                const data = await response.json();
                setHasAddresses(data.addresses && data.addresses.length > 0);
            }
        } catch (error) {
            console.error("Error checking addresses:", error);
        } finally {
            setCheckingAddresses(false);
        }
    };

    const updateQuantity = async (productId: string, quantity: number) => {
        try {
            setUpdating(productId);
            const response = await fetch("/api/cart/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, quantity }),
            });

            if (!response.ok) throw new Error("Failed to update cart");
            const data = await response.json();
            setCart(data.cart);
        } catch (error) {
            console.error("Error updating cart:", error);
            alert("Failed to update cart");
        } finally {
            setUpdating(null);
        }
    };

    const removeItem = async (productId: string) => {
        if (!confirm("Remove this item from cart?")) return;

        try {
            setUpdating(productId);
            const response = await fetch("/api/cart/remove", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId }),
            });

            if (!response.ok) throw new Error("Failed to remove item");
            const data = await response.json();
            setCart(data.cart);
        } catch (error) {
            console.error("Error removing item:", error);
            alert("Failed to remove item");
        } finally {
            setUpdating(null);
        }
    };

    useEffect(() => {
        fetchCart();
        checkAddresses();
    }, []);

    if (loading) {
        return <div style={{ textAlign: "center", padding: "40px" }}>Loading cart...</div>;
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div style={{ textAlign: "center", padding: "60px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                <h2 style={{ marginBottom: "20px", color: "#666" }}>Your cart is empty</h2>
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
                    Continue Shopping
                </a>
            </div>
        );
    }

    const total = cart.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    return (
        <div>
            <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                            <th style={{ padding: "16px", textAlign: "left" }}>Product</th>
                            <th style={{ padding: "16px", textAlign: "right" }}>Price</th>
                            <th style={{ padding: "16px", textAlign: "center" }}>Quantity</th>
                            <th style={{ padding: "16px", textAlign: "right" }}>Subtotal</th>
                            <th style={{ padding: "16px", textAlign: "center" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cart.items.map((item) => (
                            <tr
                                key={item.id}
                                style={{
                                    borderBottom: "1px solid #eee",
                                    opacity: updating === item.product.id ? 0.5 : 1,
                                }}
                            >
                                <td style={{ padding: "16px" }}>
                                    <div style={{ fontWeight: "600" }}>{item.product.title}</div>
                                    <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                                        {item.product.stock > 0 ? (
                                            <span style={{ color: "#10b981" }}>In stock</span>
                                        ) : (
                                            <span style={{ color: "#dc2626" }}>Out of stock</span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: "16px", textAlign: "right", fontWeight: "600" }}>
                                    ${(item.product.price / 100).toFixed(2)}
                                </td>
                                <td style={{ padding: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                        <button
                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                            disabled={updating === item.product.id}
                                            style={{
                                                padding: "6px 12px",
                                                backgroundColor: "#f5f5f5",
                                                border: "1px solid #ccc",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontWeight: "600",
                                            }}
                                        >
                                            −
                                        </button>
                                        <span style={{ minWidth: "30px", textAlign: "center", fontWeight: "600" }}>
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                            disabled={updating === item.product.id || item.quantity >= item.product.stock}
                                            style={{
                                                padding: "6px 12px",
                                                backgroundColor: "#f5f5f5",
                                                border: "1px solid #ccc",
                                                borderRadius: "4px",
                                                cursor: item.quantity >= item.product.stock ? "not-allowed" : "pointer",
                                                fontWeight: "600",
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>
                                </td>
                                <td style={{ padding: "16px", textAlign: "right", fontWeight: "700", color: "#0070f3" }}>
                                    ${((item.product.price * item.quantity) / 100).toFixed(2)}
                                </td>
                                <td style={{ padding: "16px", textAlign: "center" }}>
                                    <button
                                        onClick={() => removeItem(item.product.id)}
                                        disabled={updating === item.product.id}
                                        style={{
                                            padding: "8px 16px",
                                            backgroundColor: "#dc2626",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontSize: "14px",
                                        }}
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div
                style={{
                    marginTop: "30px",
                    padding: "24px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ margin: 0 }}>Cart Total</h2>
                    <div style={{ fontSize: "32px", fontWeight: "700", color: "#0070f3" }}>
                        ${(total / 100).toFixed(2)}
                    </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                    <a
                        href="/products"
                        style={{
                            flex: 1,
                            padding: "14px",
                            textAlign: "center",
                            backgroundColor: "#f5f5f5",
                            color: "#333",
                            textDecoration: "none",
                            borderRadius: "6px",
                            fontWeight: "600",
                            border: "1px solid #ccc",
                        }}
                    >
                        Continue Shopping
                    </a>
                    {!hasAddresses ? (
                        <div style={{ flex: 1 }}>
                            <div
                                style={{
                                    padding: "12px",
                                    backgroundColor: "#fef2f2",
                                    border: "1px solid #fca5a5",
                                    borderRadius: "6px",
                                    marginBottom: "8px",
                                    textAlign: "center",
                                }}
                            >
                                <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#991b1b", fontWeight: "600" }}>
                                    ⚠️ You need to add at least one address before checkout.
                                </p>
                            </div>
                            <button
                                onClick={() => router.push("/profile/addresses")}
                                style={{
                                    width: "100%",
                                    padding: "14px",
                                    backgroundColor: "#3b82f6",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: "16px",
                                }}
                            >
                                Add Address
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => router.push("/cart/checkout")}
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
                            Proceed to Checkout
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
