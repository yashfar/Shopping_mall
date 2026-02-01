"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { sortProducts, type ProductWithReviews } from "@@/lib/sort-utils";

interface Product extends ProductWithReviews {
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

interface UseInfiniteProductsProps {
    initialProducts: Product[];
    queryParams: QueryParams;
    pageSize?: number;
}

export function useInfiniteProducts({
    initialProducts,
    queryParams,
    pageSize = 12,
}: UseInfiniteProductsProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialProducts.length >= pageSize);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Reset when query params change
    useEffect(() => {
        setProducts(initialProducts);
        setCurrentPage(1);
        setHasMore(initialProducts.length >= pageSize);
    }, [
        queryParams.q,
        queryParams.category,
        queryParams.min,
        queryParams.max,
        queryParams.rating,
        queryParams.sort,
        initialProducts,
        pageSize,
    ]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);

        try {
            const params = new URLSearchParams({
                page: String(currentPage + 1),
                pageSize: String(pageSize),
                ...queryParams,
            });

            const response = await fetch(`/api/products/list?${params.toString()}`);
            const data = await response.json();

            if (response.ok) {
                // Apply client-side sorting for rating/reviews if needed
                const sortedProducts: Product[] = sortProducts<Product>(data.products, queryParams.sort);

                setProducts((prev) => [...prev, ...sortedProducts]);
                setCurrentPage((prev) => prev + 1);
                setHasMore(data.hasMore);
            }
        } catch (error) {
            console.error("Error loading more products:", error);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, currentPage, pageSize, queryParams]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const target = entries[0];
                if (target.isIntersecting && hasMore && !loading) {
                    loadMore();
                }
            },
            {
                root: null,
                rootMargin: "200px", // Start loading 200px before reaching the bottom
                threshold: 0.1,
            }
        );

        const currentRef = loadMoreRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [loadMore, hasMore, loading]);

    return {
        products,
        loading,
        hasMore,
        loadMoreRef,
    };
}
