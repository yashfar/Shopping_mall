"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@@/components/ConfirmDialog";
import { toast } from "sonner";

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
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: "", title: "" });

    // Form state (only used for editing now)
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
            toast.success("Product updated successfully");
            await fetchProducts();
        } catch (err: any) {
            toast.error(err.message || "Failed to update product");
        } finally {
            setUpdatingId(null);
        }
    };

    // Delete product logic (API call)
    const confirmDelete = async () => {
        const { id } = deleteDialog;
        try {
            setUpdatingId(id);
            const response = await fetch(`/api/admin/products/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete product");
            }

            toast.success("Product deleted successfully");
            await fetchProducts();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete product");
        } finally {
            setUpdatingId(null);
            setDeleteDialog(prev => ({ ...prev, open: false }));
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

            toast.success(`Product ${!currentStatus ? "activated" : "deactivated"}`);
            await fetchProducts();
        } catch (err: any) {
            toast.error(err.message || "Failed to update status");
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

    // Filter products
    const filteredProducts = products.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
            {/* Confirm Dialog */}
            <ConfirmDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
                title="Delete Product"
                description={`Are you sure you want to delete "${deleteDialog.title}"? This action cannot be undone.`}
                onConfirm={confirmDelete}
                variant="destructive"
                confirmText="Delete"
            />

            {/* Action Buttons and Search */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        onClick={() => router.push("/admin/products/new")}
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
                        + Create Product
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

                <div style={{ flex: 1, maxWidth: "400px" }}>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            fontSize: "14px",
                        }}
                    />
                </div>
            </div>

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
                        {filteredProducts.map((product) => (
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
                                                    marginRight: "5px",
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                                                style={{
                                                    padding: "6px 12px",
                                                    backgroundColor: "#8b5cf6",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    marginTop: "5px",
                                                    display: "block",
                                                    width: "100%",
                                                }}
                                            >
                                                Edit Photos / Details
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
                                                onClick={() => setDeleteDialog({ open: true, id: product.id, title: product.title })}
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

            {filteredProducts.length === 0 && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "40px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "8px",
                        marginTop: "20px",
                    }}
                >
                    <p style={{ color: "#666" }}>
                        {searchTerm ? "No products found matching your search." : "No products found. Create your first product!"}
                    </p>
                </div>
            )}
        </div>
    );
}
