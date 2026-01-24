"use client";

import ProductCard from "./ProductCard";
import { useInfiniteProducts } from "@@/hooks/useInfiniteProducts";

interface Product {
    id: string;
    title: string;
    price: number;
    thumbnail: string | null;
    reviews: { id: string; rating: number }[];
    [key: string]: any;
}

interface QueryParams {
    q?: string;
    category?: string;
    min?: string;
    max?: string;
    rating?: string;
    sort?: string;
}

interface ProductInfiniteListProps {
    initialProducts: Product[];
    queryParams: QueryParams;
    emptyMessage?: string;
    emptyDescription?: string;
}

export default function ProductInfiniteList({
    initialProducts,
    queryParams,
    emptyMessage = "No products found",
    emptyDescription = "Try adjusting your search or filters",
}: ProductInfiniteListProps) {
    const { products, loading, hasMore, loadMoreRef } = useInfiniteProducts({
        initialProducts,
        queryParams,
        pageSize: 12,
    });

    if (products.length === 0 && !loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-24 h-24 text-gray-300 mb-4"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                    />
                </svg>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                    {emptyMessage}
                </h2>
                <p className="text-gray-500 text-center max-w-md">
                    {emptyDescription}
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {/* Loading Spinner */}
            {loading && (
                <div className="flex justify-center items-center py-8">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                    </div>
                </div>
            )}

            {/* Load More Trigger */}
            {hasMore && !loading && (
                <div
                    ref={loadMoreRef}
                    className="h-20 flex items-center justify-center"
                >
                    <span className="text-sm text-gray-400">Loading more...</span>
                </div>
            )}

            {/* End Message */}
            {!hasMore && products.length > 0 && (
                <div className="flex justify-center items-center py-8">
                    <p className="text-gray-500 text-sm">
                        You've reached the end of the list
                    </p>
                </div>
            )}
        </div>
    );
}
