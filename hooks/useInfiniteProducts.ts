"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { buildCatalogRequestParams } from "@@/lib/catalog-query-params";

interface Product {
    id: string;
    title: string;
    price: number;
    thumbnail: string | null;
    reviews: { id: string; rating: number }[];
    [key: string]: unknown;
}

interface QueryParams {
    q?: string;
    category?: string;
    min?: string;
    max?: string;
    rating?: string;
    sort?: string;
    inStock?: string;
    onSale?: string;
    priceCurrency?: string;
}

interface UseInfiniteProductsProps {
    initialProducts: Product[];
    initialHasMore?: boolean;
    queryParams: QueryParams;
    locale?: string;
    pageSize?: number;
}

export function useInfiniteProducts({
    initialProducts,
    initialHasMore,
    queryParams,
    locale = "tr",
    pageSize = 12,
}: UseInfiniteProductsProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialHasMore ?? initialProducts.length >= pageSize);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Reset when query params change
    useEffect(() => {
        setProducts(initialProducts);
        setCurrentPage(1);
        setHasMore(initialHasMore ?? initialProducts.length >= pageSize);
    }, [
        queryParams.q,
        queryParams.category,
        queryParams.min,
        queryParams.max,
        queryParams.rating,
        queryParams.sort,
        queryParams.inStock,
        queryParams.onSale,
        queryParams.priceCurrency,
        initialProducts,
        initialHasMore,
        pageSize,
    ]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);

        try {
            const params = buildCatalogRequestParams({
                page: currentPage + 1,
                pageSize,
                locale,
                queryParams,
            });

            const response = await fetch(`/api/products/list?${params.toString()}`);
            const data = await response.json();

            if (response.ok) {
                setProducts((prev) => [...prev, ...data.products]);
                setCurrentPage((prev) => prev + 1);
                setHasMore(data.hasMore);
            }
        } catch (error) {
            console.error("Error loading more products:", error);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, currentPage, pageSize, locale, queryParams]);

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
