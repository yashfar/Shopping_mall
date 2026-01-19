"use client";

import { useEffect, useState } from "react";

type Product = {
    id: string;
    title: string;
    description: string | null;
    price: number;
    stock: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export default function ProductManagement() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        stock: "0",
        isActive: true,
    });

    // Fetch products
    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await fetch("/api/admin/products");

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

    // Create product
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch("/api/admin/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description || null,
                    price: Math.round(parseFloat(formData.price) * 100), // Convert to cents
                    stock: parseInt(formData.stock),
                    isActive: formData.isActive,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create product");
            }

            setFormData({ title: "", description: "", price: "", stock: "0", isActive: true });
            setShowCreateForm(false);
            await fetchProducts();
        } catch (err: any) {
            alert(err.message || "Failed to create product");
        }
    };

    // Update product
    const handleUpdate = async (id: string) => {
        try {
            setUpdatingId(id);
            const response = await fetch(`/api/admin/products/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description || null,
                    price: Math.round(parseFloat(formData.price) * 100),
                    stock: parseInt(formData.stock),
                    isActive: formData.isActive,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update product");
            }

            setEditingId(null);
            setFormData({ title: "", description: "", price: "", stock: "0", isActive: true });
            await fetchProducts();
        } catch (err: any) {
            alert(err.message || "Failed to update product");
        } finally {
            setUpdatingId(null);
        }
    };

    // Delete product
    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete: ${title}?`)) {
            return;
        }

        try {
            setUpdatingId(id);
            const response = await fetch(`/api/admin/products/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete product");
            }

            await fetchProducts();
        } catch (err: any) {
            alert(err.message || "Failed to delete product");
        } finally {
            setUpdatingId(null);
        }
    };

    // Toggle active status
    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            setUpdatingId(id);
            const response = await fetch(`/api/admin/products/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (!response.ok) {
                throw new Error("Failed to update status");
            }

            await fetchProducts();
        } catch (err: any) {
            alert(err.message || "Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    // Start editing
    const startEdit = (product: Product) => {
        setEditingId(product.id);
        setFormData({
            title: product.title,
            description: product.description || "",
            price: (product.price / 100).toFixed(2), // Convert from cents
            stock: product.stock.toString(),
            isActive: product.isActive,
        });
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    if (loading) {
        return <div style={{ textAlign: "center", padding: "40px" }}>Loading products...</div>;
    }

    if (error) {
        return (
            <div style={{ backgroundColor: "#ffe6e6", padding: "20px", borderRadius: "8px", color: "red" }}>
                <p>{error}</p>
                <button onClick={fetchProducts} style={{ padding: "8px 16px", backgroundColor: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Create Button */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "600",
                    }}
                >
                    {showCreateForm ? "Cancel" : "+ Create Product"}
                </button>
                <button
                    onClick={fetchProducts}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#f5f5f5",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        cursor: "pointer",
                    }}
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <form
                    onSubmit={handleCreate}
                    style={{
                        backgroundColor: "#f9fafb",
                        padding: "20px",
                        borderRadius: "8px",
                        marginBottom: "30px",
                        border: "1px solid #e5e7eb",
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>Create New Product</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                                Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                                Price (USD) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                                Stock
                            </label>
                            <input
                                type="number"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                                Active
                            </label>
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                style={{ width: "20px", height: "20px", marginTop: "8px" }}
                            />
                        </div>
                    </div>
                    <div style={{ marginTop: "15px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                fontFamily: "inherit",
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        style={{
                            marginTop: "15px",
                            padding: "10px 20px",
                            backgroundColor: "#0070f3",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "600",
                        }}
                    >
                        Create Product
                    </button>
                </form>
            )}

            {/* Products Table */}
            <div style={{ overflowX: "auto" }}>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        backgroundColor: "white",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                >
                    <thead>
                        <tr style={{ backgroundColor: "#f5f5f5" }}>
                            <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>
                                Title
                            </th>
                            <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>
                                Description
                            </th>
                            <th style={{ padding: "12px", textAlign: "right", borderBottom: "2px solid #ddd" }}>
                                Price
                            </th>
                            <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #ddd" }}>
                                Stock
                            </th>
                            <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #ddd" }}>
                                Active
                            </th>
                            <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #ddd" }}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr
                                key={product.id}
                                style={{
                                    borderBottom: "1px solid #eee",
                                    opacity: updatingId === product.id ? 0.5 : 1,
                                }}
                            >
                                {editingId === product.id ? (
                                    <>
                                        <td style={{ padding: "12px" }}>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                style={{ width: "100%", padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                            />
                                        </td>
                                        <td style={{ padding: "12px" }}>
                                            <input
                                                type="text"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                style={{ width: "100%", padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                            />
                                        </td>
                                        <td style={{ padding: "12px" }}>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                style={{ width: "100%", padding: "6px", border: "1px solid #ccc", borderRadius: "4px", textAlign: "right" }}
                                            />
                                        </td>
                                        <td style={{ padding: "12px" }}>
                                            <input
                                                type="number"
                                                value={formData.stock}
                                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                                style={{ width: "60px", padding: "6px", border: "1px solid #ccc", borderRadius: "4px", textAlign: "center" }}
                                            />
                                        </td>
                                        <td style={{ padding: "12px", textAlign: "center" }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                style={{ width: "20px", height: "20px" }}
                                            />
                                        </td>
                                        <td style={{ padding: "12px", textAlign: "center" }}>
                                            <button
                                                onClick={() => handleUpdate(product.id)}
                                                disabled={updatingId === product.id}
                                                style={{
                                                    padding: "6px 12px",
                                                    backgroundColor: "#10b981",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    marginRight: "5px",
                                                }}
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setFormData({ title: "", description: "", price: "", stock: "0", isActive: true });
                                                }}
                                                style={{
                                                    padding: "6px 12px",
                                                    backgroundColor: "#6b7280",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td style={{ padding: "12px", fontWeight: "500" }}>{product.title}</td>
                                        <td style={{ padding: "12px", color: "#666", fontSize: "14px" }}>
                                            {product.description || "-"}
                                        </td>
                                        <td style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}>
                                            ${(product.price / 100).toFixed(2)}
                                        </td>
                                        <td style={{ padding: "12px", textAlign: "center" }}>{product.stock}</td>
                                        <td style={{ padding: "12px", textAlign: "center" }}>
                                            <button
                                                onClick={() => toggleActive(product.id, product.isActive)}
                                                disabled={updatingId === product.id}
                                                style={{
                                                    padding: "4px 12px",
                                                    backgroundColor: product.isActive ? "#10b981" : "#ef4444",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                }}
                                            >
                                                {product.isActive ? "Active" : "Inactive"}
                                            </button>
                                        </td>
                                        <td style={{ padding: "12px", textAlign: "center" }}>
                                            <button
                                                onClick={() => startEdit(product)}
                                                disabled={updatingId === product.id}
                                                style={{
                                                    padding: "6px 12px",
                                                    backgroundColor: "#0070f3",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    marginRight: "5px",
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id, product.title)}
                                                disabled={updatingId === product.id}
                                                style={{
                                                    padding: "6px 12px",
                                                    backgroundColor: "#dc2626",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {products.length === 0 && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "40px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "8px",
                        marginTop: "20px",
                    }}
                >
                    <p style={{ color: "#666" }}>No products found. Create your first product!</p>
                </div>
            )}
        </div>
    );
}
