"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search, X, Check, Loader2 } from "lucide-react";
import { cn } from "@@/lib/utils";

interface Product {
    id: string;
    title: string;
    description: string | null;
    price: number;
    thumbnail: string | null;
    stock: number;
    isActive: boolean;
}

interface ProductSelectModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (productIds: string[]) => void;
    currentCount: number; // How many already in carousel
    existingProductIds: string[]; // Already in carousel
}

export default function ProductSelectModal({
    open,
    onClose,
    onSelect,
    currentCount,
    existingProductIds,
}: ProductSelectModalProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const maxItems = 12;
    const remainingSlots = maxItems - currentCount;

    // Fetch products
    useEffect(() => {
        if (!open) return;

        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (search) params.append("search", search);

                const res = await fetch(`/api/admin/products?${params.toString()}`);
                const data = await res.json();
                if (data.products) {
                    setProducts(data.products);
                }
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchProducts, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [open, search]);

    // Reset selection when closed
    useEffect(() => {
        if (!open) {
            setSelectedIds([]);
            setSearch("");
        }
    }, [open]);

    const toggleSelection = (productId: string) => {
        if (selectedIds.includes(productId)) {
            setSelectedIds(selectedIds.filter((id) => id !== productId));
        } else {
            if (selectedIds.length >= remainingSlots) {
                return; // Max limit reached
            }
            setSelectedIds([...selectedIds, productId]);
        }
    };

    const handleConfirm = () => {
        setSubmitting(true);
        onSelect(selectedIds);
        setSubmitting(false);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-[#1A1A1A]">Select Products</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Selected: {selectedIds.length} / {remainingSlots} available slots
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100 bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#C8102E]/20 focus:bg-white rounded-xl outline-none transition-all placeholder:text-gray-400 font-medium"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 text-[#C8102E] animate-spin" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            No products found.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {products.map((product) => {
                                const isSelected = selectedIds.includes(product.id);
                                const isAlreadyIn = existingProductIds.includes(product.id);
                                const isDisabled = isAlreadyIn || (!isSelected && selectedIds.length >= remainingSlots);

                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => !isDisabled && toggleSelection(product.id)}
                                        className={cn(
                                            "flex gap-3 p-3 rounded-xl border border-gray-200 bg-white transition-all cursor-pointer group hover:border-[#C8102E]/30 hover:shadow-md",
                                            isSelected && "border-[#C8102E] ring-1 ring-[#C8102E] bg-[#C8102E]/5",
                                            isDisabled && "opacity-50 cursor-not-allowed grayscale hover:border-gray-200 hover:shadow-none"
                                        )}
                                    >
                                        <div className="relative w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                                            {product.thumbnail ? (
                                                <Image
                                                    src={product.thumbnail}
                                                    alt={product.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <span className="text-xs">No Img</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-bold text-[#1A1A1A] text-sm line-clamp-2 leading-tight">
                                                    {product.title}
                                                </h3>
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                                    isSelected
                                                        ? "bg-[#C8102E] border-[#C8102E]"
                                                        : "border-gray-300 group-hover:border-[#C8102E]/50"
                                                )}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>
                                            <p className="text-gray-500 text-xs mt-1">
                                                ${(product.price / 100).toFixed(2)}
                                            </p>
                                            <p className="text-xs mt-1 text-gray-400">
                                                {isAlreadyIn ? "Already added" : product.stock > 0 ? "In Stock" : "Out of Stock"}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedIds.length === 0 || submitting}
                        className="px-6 py-2.5 bg-[#C8102E] text-white font-bold rounded-xl hover:bg-[#A00D24] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#C8102E]/20"
                    >
                        {submitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            `Add ${selectedIds.length} Products`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
