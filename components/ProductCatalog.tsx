"use client";

import { useState, useEffect } from "react";
import Filters from "./Filters";
import SortMenu from "./SortMenu";
import ProductInfiniteList from "./ProductInfiniteList";

interface Product {
    id: string;
    title: string;
    price: number;
    thumbnail: string | null;
    reviews: { id: string; rating: number }[];
    [key: string]: any;
}

interface ProductCatalogProps {
    initialProducts: Product[];
    categories: string[];
    queryParams: {
        q?: string;
        category?: string;
        min?: string;
        max?: string;
        rating?: string;
        sort?: string;
    };
    title?: string;
    description?: string;
    showFilters?: boolean;
}

export default function ProductCatalog({
    initialProducts,
    categories,
    queryParams,
    title = "All Products",
    description = "Browse our collection",
    showFilters = true,
}: ProductCatalogProps) {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Prevent scrolling when drawer is open
    useEffect(() => {
        if (isFilterOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isFilterOpen]);

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                            {description && (
                                <p className="text-sm text-gray-500 mt-1">{description}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {showFilters && (
                                <button
                                    onClick={() => setIsFilterOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                                    </svg>
                                    Filters
                                </button>
                            )}
                            <SortMenu />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Side Sheet (Drawer) */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity opacity-100"
                        onClick={() => setIsFilterOpen(false)}
                    />

                    {/* Drawer Panel */}
                    <div
                        className="relative w-full max-w-sm bg-white h-full shadow-2xl overflow-y-auto animate-slide-in"
                        style={{ animation: "slideInRight 0.3s ease-out forwards" }}
                    >
                        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <Filters categories={categories} />
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0.5; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <main className="w-full">
                    {/* Active Filter Badges */}
                    {(queryParams.category || queryParams.min || queryParams.max || queryParams.rating) && (
                        <div className="mb-6 flex flex-wrap gap-2">
                            {queryParams.category && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                    Category: {queryParams.category}
                                </span>
                            )}
                            {(queryParams.min || queryParams.max) && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                    Price: ${queryParams.min ? (parseFloat(queryParams.min) / 100).toFixed(0) : "0"} - $
                                    {queryParams.max ? (parseFloat(queryParams.max) / 100).toFixed(0) : "∞"}
                                </span>
                            )}
                            {queryParams.rating && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                    Rating: {queryParams.rating}+ stars
                                </span>
                            )}
                            <button
                                onClick={() => window.location.href = window.location.pathname}
                                className="text-sm text-gray-500 underline ml-2 hover:text-purple-600"
                            >
                                Clear all
                            </button>
                        </div>
                    )}

                    <ProductInfiniteList
                        initialProducts={initialProducts}
                        queryParams={queryParams}
                        emptyMessage="No products found"
                        emptyDescription="Try adjusting your filters to find what you're looking for."
                    />
                </main>
            </div>
        </div>
    );
}
