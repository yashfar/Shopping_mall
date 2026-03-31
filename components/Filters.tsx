"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface FiltersProps {
    categories: string[];
}

export default function Filters({ categories }: FiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations("filters");

    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

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

    // Load price values from URL on mount
    useEffect(() => {
        setMinPrice(searchParams.get("min") || "");
        setMaxPrice(searchParams.get("max") || "");
    }, [searchParams]);

    const hasActiveFilters = currentCategory || currentRating || searchParams.get("min") || searchParams.get("max");

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-[#1A1A1A]">{t("title")}</h2>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="text-sm text-[#C8102E] hover:text-[#A90D27] font-bold"
                    >
                        {t("clearAll")}
                    </button>
                )}
            </div>

            {/* Quick Toggles */}
            <div className="border-t border-[#A9A9A9]/20 pt-4 space-y-3">
                <label className="flex items-center justify-between cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#C8102E] transition-colors">{t("inStockOnly")}</span>
                    <button
                        onClick={() => updateFilters("inStock", inStockOnly ? "" : "true")}
                        className={`relative w-10 h-6 rounded-full transition-colors ${inStockOnly ? "bg-[#C8102E]" : "bg-gray-200"}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${inStockOnly ? "translate-x-4" : ""}`} />
                    </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#C8102E] transition-colors">{t("onSale")}</span>
                    <button
                        onClick={() => updateFilters("onSale", onSaleOnly ? "" : "true")}
                        className={`relative w-10 h-6 rounded-full transition-colors ${onSaleOnly ? "bg-[#C8102E]" : "bg-gray-200"}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${onSaleOnly ? "translate-x-4" : ""}`} />
                    </button>
                </label>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
                <div className="border-t border-[#A9A9A9]/20 pt-4">
                    <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">{t("category")}</h3>
                    <div className="space-y-2">
                        {categories.map((category) => (
                            <label
                                key={category}
                                className="flex items-center cursor-pointer hover:bg-red-50 p-2 rounded-lg transition-colors group"
                            >
                                <input
                                    type="checkbox"
                                    checked={currentCategory === category}
                                    onChange={() => handleCategoryChange(category)}
                                    className="w-4 h-4 text-[#C8102E] border-[#A9A9A9] rounded focus:ring-[#C8102E]"
                                />
                                <span className="ml-3 text-sm font-semibold text-[#1A1A1A] group-hover:text-[#C8102E] capitalize transition-colors">
                                    {category}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Price Filter */}
            <div className="border-t border-[#A9A9A9]/20 pt-4">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">{t("priceRange")}</h3>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-[#A9A9A9] mb-1.5 block">{t("minPrice")}</label>
                            <input
                                type="number"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                placeholder="0"
                                min="0"
                                className="w-full px-4 py-2 border border-[#A9A9A9] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E] font-medium"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-[#A9A9A9] mb-1.5 block">{t("maxPrice")}</label>
                            <input
                                type="number"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                placeholder={t("maxPlaceholder")}
                                min="0"
                                className="w-full px-4 py-2 border border-[#A9A9A9] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E] font-medium"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handlePriceFilter}
                        className="w-full px-4 py-2.5 bg-[#C8102E] text-white rounded-lg hover:bg-[#A90D27] transition-all duration-300 text-sm font-bold shadow-md active:scale-95"
                    >
                        {t("applyPriceFilter")}
                    </button>
                </div>
            </div>

            {/* Rating Filter */}
            <div className="border-t border-[#A9A9A9]/20 pt-4">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">{t("customerRating")}</h3>
                <div className="space-y-2">
                    {["4", "3", "2", "1"].map((rating) => (
                        <button
                            key={rating}
                            onClick={() => handleRatingChange(rating)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${currentRating === rating
                                ? "bg-red-50 border-2 border-[#C8102E]"
                                : "border border-[#A9A9A9]/20 hover:border-[#C8102E] hover:bg-red-50/5"
                                }`}
                        >
                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: 5 }, (_, i) => (
                                    <svg
                                        key={i}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill={i < parseInt(rating) ? "currentColor" : "none"}
                                        stroke="currentColor"
                                        strokeWidth={i < parseInt(rating) ? 0 : 2}
                                        className={`w-4 h-4 ${i < parseInt(rating) ? "text-[#C8102E]" : "text-[#A9A9A9]"
                                            }`}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                        />
                                    </svg>
                                ))}
                                <span className={`ml-2 text-sm font-bold ${currentRating === rating ? "text-[#C8102E]" : "text-[#A9A9A9]"}`}>{t("andUp")}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
