"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
    id: string;
    title: string;
    description: string | null;
    price: number;
    stock: number;
    createdAt: string;
};

export default function ProductList() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [addingToCart, setAddingToCart] = useState<string | null>(null);

    const addToCart = async (productId: string) => {
        try {
            setAddingToCart(productId);
            const response = await fetch("/api/cart/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, quantity: 1 }),
            });

            if (response.status === 401) {
                // Not logged in, redirect to login
                router.push("/login?callbackUrl=/products");
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `Server error: ${response.status}`;
                throw new Error(errorMessage);
            }

            // Show success message
            alert("Product added to cart!");
        } catch (err: any) {
            console.error("Error adding to cart:", err);
            alert(err.message || "Failed to add to cart");
        } finally {
            setAddingToCart(null);
        }
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await fetch("/api/products");

                if (!response.ok) {
                    throw new Error("Failed to fetch products");
                }

                const data = await response.json();
                setProducts(data.products);
            } catch (err) {
                setError("Failed to load products");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "60px" }}>
                <p style={{ fontSize: "18px", color: "#666" }}>Loading products...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    backgroundColor: "#ffe6e6",
                    padding: "30px",
                    borderRadius: "8px",
                    textAlign: "center",
                }}
            >
                <p style={{ color: "#dc2626", fontSize: "16px" }}>{error}</p>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div
                style={{
                    textAlign: "center",
                    padding: "60px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                }}
            >
                <p style={{ fontSize: "18px", color: "#666" }}>
                    No products available at the moment.
                </p>
            </div>
        );
    }

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "30px",
            }}
        >
            {products.map((product) => (
                <div
                    key={product.id}
                    style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "24px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                    }}
                >
                    <h3
                        style={{
                            margin: "0 0 12px 0",
                            fontSize: "20px",
                            fontWeight: "600",
                            color: "#111",
                        }}
                    >
                        {product.title}
                    </h3>

                    <p
                        style={{
                            margin: "0 0 16px 0",
                            color: "#666",
                            fontSize: "14px",
                            lineHeight: "1.6",
                            minHeight: "60px",
                        }}
                    >
                        {product.description || "No description available"}
                    </p>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingTop: "16px",
                            borderTop: "1px solid #e5e7eb",
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: "24px",
                                    fontWeight: "700",
                                    color: "#0070f3",
                                }}
                            >
                                ${(product.price / 100).toFixed(2)}
                            </div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#666",
                                    marginTop: "4px",
                                }}
                            >
                                {product.stock > 0 ? (
                                    <span style={{ color: "#10b981" }}>
                                        ✓ In stock ({product.stock})
                                    </span>
                                ) : (
                                    <span style={{ color: "#dc2626" }}>Out of stock</span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => addToCart(product.id)}
                            disabled={product.stock === 0 || addingToCart === product.id}
                            style={{
                                padding: "10px 20px",
                                backgroundColor:
                                    product.stock > 0 && addingToCart !== product.id
                                        ? "#0070f3"
                                        : "#ccc",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor:
                                    product.stock > 0 && addingToCart !== product.id
                                        ? "pointer"
                                        : "not-allowed",
                                fontWeight: "600",
                                fontSize: "14px",
                            }}
                        >
                            {addingToCart === product.id
                                ? "Adding..."
                                : product.stock > 0
                                    ? "Add to Cart"
                                    : "Unavailable"}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
