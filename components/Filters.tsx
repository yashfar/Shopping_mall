"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@@/context/CurrencyContext";
import { getCurrencySymbol } from "@@/lib/format-price";

interface FiltersProps {
    categories: string[];
}

export default function Filters({ categories }: FiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations("filters");
    const { currency } = useCurrency();
    const currencySymbol = getCurrencySymbol(currency);

    const [minPrice, setMinPrice] = useState(() => searchParams.get("min") || "");
    const [maxPrice, setMaxPrice] = useState(() => searchParams.get("max") || "");

    // Get current filters from URL
    const currentCategory = searchParams.get("category") || "";
    const currentRating = searchParams.get("rating") || "";
    const currentQuery = searchParams.get("q") || "";
    const inStockOnly = searchParams.get("inStock") === "true";
    const onSaleOnly = searchParams.get("onSale") === "true";

    const updateFilters = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }

        router.push(`/search?${params.toString()}`);
    };

    const handleCategoryChange = (category: string) => {
        updateFilters("category", category === currentCategory ? "" : category);
    };

    const handleRatingChange = (rating: string) => {
        updateFilters("rating", rating === currentRating ? "" : rating);
    };

    const handlePriceFilter = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (minPrice) {
            params.set("min", minPrice);
        } else {
            params.delete("min");
        }

        if (maxPrice) {
            params.set("max", maxPrice);
        } else {
            params.delete("max");
        }

        router.push(`/search?${params.toString()}`);
    };

    const clearAllFilters = () => {
        setMinPrice("");
        setMaxPrice("");
        if (currentQuery) {
            router.push(`/search?q=${currentQuery}`);
        } else {
            router.push("/search");
        }
    };

    const hasActiveFilters = currentCategory || currentRating || searchParams.get("min") || searchParams.get("max");

    return (
        <div>
            {/* Availability */}
            <section className="pb-5">
                <div className="flex items-center justify-between gap-4">
                    <h3 className="text-sm font-bold text-foreground">{t("availability")}</h3>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearAllFilters}
                            className="rounded-sm text-xs font-bold text-primary transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {t("clearAll")}
                        </button>
                    )}
                </div>
                <div className="mt-2 space-y-1">
                    <div className="group flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/10">
                        <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">{t("inStockOnly")}</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={inStockOnly}
                            onClick={() => updateFilters("inStock", inStockOnly ? "" : "true")}
                            className={`relative h-6 w-10 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${inStockOnly ? "bg-primary" : "bg-gray-200"}`}
                        >
                            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${inStockOnly ? "translate-x-4" : ""}`} />
                        </button>
                    </div>
                    <div className="group flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/10">
                        <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">{t("onSale")}</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={onSaleOnly}
                            onClick={() => updateFilters("onSale", onSaleOnly ? "" : "true")}
                            className={`relative h-6 w-10 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${onSaleOnly ? "bg-primary" : "bg-gray-200"}`}
                        >
                            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${onSaleOnly ? "translate-x-4" : ""}`} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Category Filter */}
            {categories.length > 0 && (
                <section className="border-t border-border/20 py-5">
                    <h3 className="mb-2.5 text-sm font-bold text-foreground">{t("category")}</h3>
                    <div className="space-y-1">
                        {categories.map((category) => {
                            const isSelected = currentCategory === category;
                            return (
                                <label
                                    key={category}
                                    className={`group flex cursor-pointer items-center rounded-lg px-2 py-1.5 transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/10"}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleCategoryChange(category)}
                                        className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-2 focus:ring-ring focus:ring-offset-1"
                                    />
                                    <span className={`ml-3 text-sm font-medium capitalize transition-colors ${isSelected ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
                                        {category}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Price Filter */}
            <section className="border-t border-border/20 py-5">
                <h3 className="mb-3 text-sm font-bold text-foreground">{t("priceRange")}</h3>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="min-w-0">
                            <label htmlFor="filter-min-price" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                                {t("minPrice")} ({currencySymbol})
                            </label>
                            <input
                                id="filter-min-price"
                                type="number"
                                inputMode="decimal"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                placeholder={t("minPlaceholder")}
                                min="0"
                                className="h-10 w-full rounded-lg border border-border/45 bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/65 focus:border-primary/50 focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                        <div className="min-w-0">
                            <label htmlFor="filter-max-price" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                                {t("maxPrice")} ({currencySymbol})
                            </label>
                            <input
                                id="filter-max-price"
                                type="number"
                                inputMode="decimal"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                placeholder={t("maxPlaceholder")}
                                min="0"
                                className="h-10 w-full rounded-lg border border-border/45 bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/65 focus:border-primary/50 focus:ring-2 focus:ring-ring/20"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handlePriceFilter}
                        className="h-10 w-full rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99]"
                    >
                        {t("applyPriceFilter")}
                    </button>
                </div>
            </section>

            {/* Rating Filter */}
            <section className="border-t border-border/20 pt-5">
                <h3 className="mb-2.5 text-sm font-bold text-foreground">{t("customerRating")}</h3>
                <div className="space-y-1">
                    {["4", "3", "2", "1"].map((rating) => (
                        <button
                            type="button"
                            key={rating}
                            onClick={() => handleRatingChange(rating)}
                            aria-pressed={currentRating === rating}
                            className={`flex w-full items-center rounded-lg px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${currentRating === rating ? "bg-primary/5" : "hover:bg-muted/10"}`}
                        >
                            <span className={`mr-2.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${currentRating === rating ? "border-primary bg-primary" : "border-border/70 bg-white"}`}>
                                {currentRating === rating && (
                                    <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3 text-primary-foreground" aria-hidden="true">
                                        <path d="m4 8 2.5 2.5L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </span>
                            <span className="flex items-center gap-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                    <svg
                                        key={i}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill={i < parseInt(rating) ? "currentColor" : "none"}
                                        stroke="currentColor"
                                        strokeWidth={i < parseInt(rating) ? 0 : 2}
                                        className={`h-4 w-4 ${i < parseInt(rating) ? "text-primary" : "text-muted"
                                            }`}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                        />
                                    </svg>
                                ))}
                                <span className={`ml-1.5 text-xs font-semibold ${currentRating === rating ? "text-primary" : "text-muted-foreground"}`}>{t("andUp")}</span>
                            </span>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
