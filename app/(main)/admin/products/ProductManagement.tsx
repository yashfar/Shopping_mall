"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@@/components/ConfirmDialog";
import { toast } from "sonner";
import { Button } from "@@/components/ui/button";
import {
    Edit,
    Trash2,
    Plus,
    Search,
    RefreshCw,
    ImageIcon,
    Package,
    CheckCircle2,
    XCircle
} from "lucide-react";
import Link from "next/link";

type Product = {
    id: string;
    title: string;
    description: string | null;
    price: number;
    stock: number;
    isActive: boolean;
    thumbnail?: string | null; // Added potential field
    createdAt: string;
    updatedAt: string;
};

export default function ProductManagement() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: "", title: "" });
    const [updatingId, setUpdatingId] = useState<string | null>(null);

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

    // Delete product logic
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
            // Optimistic update
            setProducts(products.map(p =>
                p.id === id ? { ...p, isActive: !currentStatus } : p
            ));
        } catch (err: any) {
            toast.error(err.message || "Failed to update status");
            await fetchProducts(); // Revert on error
        } finally {
            setUpdatingId(null);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8102E]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-red-600 flex flex-col items-center gap-4">
                <p>{error}</p>
                <Button onClick={fetchProducts} variant="outline" className="border-red-200 hover:bg-red-100">
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
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

            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative flex-1 max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all text-sm"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button
                        onClick={fetchProducts}
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        title="Refresh"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Link href="/admin/products/new" className="w-full md:w-auto">
                        <Button className="w-full bg-[#C8102E] hover:bg-[#A90D27] text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Product
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                    <div
                        key={product.id}
                        className={`group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full ${updatingId === product.id ? "opacity-60 pointer-events-none" : ""
                            }`}
                    >
                        {/* Image / Thumbnail Area */}
                        <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                            {product.thumbnail ? (
                                <img
                                    src={product.thumbnail}
                                    alt={product.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                    <ImageIcon className="w-12 h-12" />
                                </div>
                            )}

                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-md shadow-sm border ${product.isActive
                                        ? "bg-emerald-500/90 text-white border-emerald-600/20"
                                        : "bg-gray-500/90 text-white border-gray-600/20"
                                    }`}>
                                    {product.isActive ? "Active" : "Draft"}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex flex-col flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-[#C8102E] transition-colors">
                                {product.title}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">
                                {product.description || "No description provided"}
                            </p>

                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Price</span>
                                    <span className="font-bold text-lg text-gray-900">
                                        ${(product.price / 100).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Stock</span>
                                    <span className={`font-medium ${product.stock > 0 ? "text-gray-700" : "text-red-500"}`}>
                                        {product.stock}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions Overlay (Desktop) / Buttons (Mobile) */}
                        <div className="p-3 bg-gray-50/80 border-t border-gray-100 grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full bg-white hover:border-[#C8102E] hover:text-[#C8102E]"
                                onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                            >
                                <Edit className="w-3.5 h-3.5 mr-2" />
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full bg-white text-red-600 hover:bg-red-50 hover:border-red-200"
                                onClick={() => setDeleteDialog({ open: true, id: product.id, title: product.title })}
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                Delete
                            </Button>
                        </div>

                        {/* Quick Action: Toggle Status */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleActive(product.id, product.isActive);
                            }}
                            className={`absolute top-3 left-3 p-1.5 rounded-full backdrop-blur-md border transition-all ${product.isActive
                                    ? "bg-white/90 text-emerald-600 border-white/50 hover:bg-red-50 hover:text-red-600"
                                    : "bg-white/90 text-gray-400 border-white/50 hover:bg-emerald-50 hover:text-emerald-600"
                                }`}
                            title={product.isActive ? "Deactivate" : "Activate"}
                        >
                            {product.isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="bg-white p-4 rounded-full inline-flex mb-4 shadow-sm">
                        <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-6">
                        {searchTerm ? "We couldn't find any products matching your search terms." : "Get started by creating your first product in the store."}
                    </p>
                    <Link href="/admin/products/new">
                        <Button className="bg-[#C8102E] hover:bg-[#A90D27] text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Product
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
