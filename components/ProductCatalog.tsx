"use client";

import { useCallback, useState, useEffect } from "react";
import Filters from "./Filters";
import SortMenu from "./SortMenu";
import ProductInfiniteList from "./ProductInfiniteList";
import { useTranslations } from "next-intl";
import { useCurrency } from "@@/context/CurrencyContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

interface Product {
    id: string;
    title: string;
    price: number;
    thumbnail: string | null;
    reviews: { id: string; rating: number }[];
    [key: string]: unknown;
}

interface ProductCatalogProps {
    initialProducts: Product[];
    initialHasMore?: boolean;
    categories: string[];
    locale?: string;
    queryParams: {
        q?: string;
        category?: string;
        min?: string;
        max?: string;
        rating?: string;
        sort?: string;
        inStock?: string;
        onSale?: string;
        priceCurrency?: string;
    };
    title?: string;
    description?: string;
    showFilters?: boolean;
    variant?: "default" | "homeGrid";
}

export default function ProductCatalog({
    initialProducts,
    initialHasMore,
    categories,
    locale = "tr",
    queryParams,
    title = "All Products",
    description = "Browse our collection",
    showFilters = true,
    variant = "default",
}: ProductCatalogProps) {
    const t = useTranslations("catalog");
    const tf = useTranslations("filters");
    const { currency, formatPrice } = useCurrency();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isFilterClosing, setIsFilterClosing] = useState(false);
    const isHomeGrid = variant === "homeGrid";

    const openFilters = () => {
        setIsFilterClosing(false);
        setIsFilterOpen(true);
    };

    const closeFilters = useCallback(() => {
        if (isFilterOpen) {
            setIsFilterClosing(true);
        }
    }, [isFilterOpen]);

    const navigateWithParams = (params: URLSearchParams) => {
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
    };

    const removeFilter = (key: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete(key);
        if ((key === "min" || key === "max") && !params.has("min") && !params.has("max")) {
            params.delete("priceCurrency");
        }
        navigateWithParams(params);
    };

    const clearAllFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        ["category", "min", "max", "priceCurrency", "rating", "inStock", "onSale"].forEach((key) => params.delete(key));
        navigateWithParams(params);
    };

    const activeFilterChip = (key: string, label: string) => (
        <div key={key} className="inline-flex items-center gap-1 rounded-full bg-primary/5 py-1 pl-3 pr-1 text-xs font-semibold text-primary ring-1 ring-primary/10">
            <span>{label}</span>
            <button
                type="button"
                onClick={() => removeFilter(key)}
                aria-label={tf("removeFilter", { filter: label })}
                className="flex h-7 w-7 items-center justify-center rounded-full text-primary/70 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
        </div>
    );

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

    useEffect(() => {
        if (!isFilterOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeFilters();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [closeFilters, isFilterOpen]);

    return (
        <div className="min-h-screen bg-[#FAFAFA] pb-12">
            {/* Header Section */}
            {/* Header Section */}
            <div className={isHomeGrid ? "pt-8 pb-3 md:pt-10 md:pb-5" : "pt-8 pb-6"}>
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className={`flex flex-col md:flex-row md:items-end justify-between ${isHomeGrid ? "gap-4 md:gap-6" : "gap-6"}`}>
                        <div>
                            <h1 className={`${isHomeGrid ? "text-3xl md:text-5xl" : "text-4xl md:text-5xl"} font-black text-[#1A1A1A] tracking-tight`}>{title}</h1>
                            {description && (
                                <p className={`${isHomeGrid ? "mt-1.5 text-sm md:mt-2 md:text-base" : "text-base mt-2"} text-gray-500 font-medium max-w-lg`}>{description}</p>
                            )}
                        </div>

                        <div className={isHomeGrid ? "grid w-full grid-cols-2 items-center gap-2.5 md:flex md:w-auto md:gap-3" : "flex items-center gap-3"}>
                            {showFilters && (
                                <button
                                    onClick={openFilters}
                                    className={`group flex items-center justify-center bg-white border border-gray-200 text-[#1A1A1A] font-bold transition-all duration-300 hover:border-[#C8102E] hover:text-[#C8102E] active:scale-95 ${isHomeGrid ? "h-10 w-full gap-2 rounded-xl px-2.5 text-sm shadow-sm md:h-auto md:w-auto md:gap-2.5 md:rounded-full md:px-5 md:py-2.5 hover:shadow-md" : "gap-2.5 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md"}`}
                                >
                                    <span className={`${isHomeGrid ? "p-1 md:p-1.5" : "p-1.5"} bg-gray-50 rounded-full group-hover:bg-red-50 text-gray-400 group-hover:text-[#C8102E] transition-colors`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                                        </svg>
                                    </span>
                                    {t("filters")}
                                </button>
                            )}
                            <SortMenu variant={variant} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Side Sheet (Drawer) */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-[250ms] ease-out ${isFilterClosing ? "opacity-0" : "opacity-100"}`}
                        onClick={closeFilters}
                    />

                    {/* Drawer Panel */}
                    <div
                        className="relative flex h-dvh w-[calc(100vw-1rem)] max-w-sm flex-col overflow-hidden border-l border-border/30 bg-white shadow-2xl"
                        style={{
                            animation: `${isFilterClosing ? "slideOutRight" : "slideInRight"} 250ms cubic-bezier(0, 0, 0.2, 1) forwards`,
                        }}
                        onAnimationEnd={(event) => {
                            if (event.target === event.currentTarget && isFilterClosing) {
                                setIsFilterOpen(false);
                                setIsFilterClosing(false);
                            }
                        }}
                    >
                        <div className="z-10 flex shrink-0 items-center justify-between border-b border-border/20 bg-white px-5 py-4 sm:px-6">
                            <h2 className="text-2xl font-black text-[#1A1A1A]">{t("filters")}</h2>
                            <button
                                type="button"
                                onClick={closeFilters}
                                aria-label={tf("closeFilters")}
                                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 sm:px-6">
                            <Filters
                                key={currency}
                                categories={categories}
                                onPriceApplied={closeFilters}
                            />
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); }
                    to { transform: translateX(100%); }
                }
            `}</style>

            {/* Main Content */}
            <div className={`max-w-7xl mx-auto px-4 md:px-6 ${isHomeGrid ? "pt-2 pb-6 md:pt-5 md:pb-10" : "py-6 md:py-10"}`}>
                <main className="w-full">
                    {/* Active Filter Badges */}
                    {(queryParams.category || queryParams.min || queryParams.max || queryParams.rating || queryParams.inStock || queryParams.onSale) && (
                        <div className="mb-8 flex flex-wrap gap-2.5 items-center">
                            <span className="text-xs font-black text-[#A9A9A9] uppercase tracking-wider mr-1">{t("active")}</span>
                            {queryParams.category && activeFilterChip("category", `${tf("category")}: ${queryParams.category}`)}
                            {queryParams.min && activeFilterChip("min", `${tf("minPrice")}: ${formatPrice(Math.round(parseFloat(queryParams.min) * 100))}`)}
                            {queryParams.max && activeFilterChip("max", `${tf("maxPrice")}: ${formatPrice(Math.round(parseFloat(queryParams.max) * 100))}`)}
                            {queryParams.rating && activeFilterChip("rating", t("stars", { count: queryParams.rating }))}
                            {queryParams.inStock === "true" && activeFilterChip("inStock", tf("inStockOnly"))}
                            {queryParams.onSale === "true" && activeFilterChip("onSale", tf("onSale"))}
                            <button
                                type="button"
                                onClick={clearAllFilters}
                                className="text-sm font-bold text-[#A9A9A9] hover:text-[#C8102E] ml-2 transition-colors border-b-2 border-transparent hover:border-[#C8102E]/30 pb-0.5"
                            >
                                {t("clearAllFilters")}
                            </button>
                        </div>
                    )}

                    <ProductInfiniteList
                        initialProducts={initialProducts}
                        initialHasMore={initialHasMore}
                        queryParams={queryParams}
                        locale={locale}
                        variant={variant}
                        emptyMessage={t("noProductsFound")}
                        emptyDescription={t("noProductsDescription")}
                    />
                </main>
            </div>
        </div>
    );
}
