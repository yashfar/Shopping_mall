"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface FiltersProps {
    categories: string[];
}

export default function Filters({ categories }: FiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    // Get current filters from URL
    const currentCategory = searchParams.get("category") || "";
    const currentRating = searchParams.get("rating") || "";
    const currentQuery = searchParams.get("q") || "";

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
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Category</h3>
                    <div className="space-y-2">
                        {categories.map((category) => (
                            <label
                                key={category}
                                className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                            >
                                <input
                                    type="checkbox"
                                    checked={currentCategory === category}
                                    onChange={() => handleCategoryChange(category)}
                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <span className="ml-2 text-sm text-gray-700 capitalize">
                                    {category}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Price Filter */}
            <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h3>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-gray-600 mb-1 block">Min ($)</label>
                            <input
                                type="number"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                placeholder="0"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-gray-600 mb-1 block">Max ($)</label>
                            <input
                                type="number"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                placeholder="Any"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handlePriceFilter}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                        Apply Price Filter
                    </button>
                </div>
            </div>

            {/* Rating Filter */}
            <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Rating</h3>
                <div className="space-y-2">
                    {["4", "3", "2"].map((rating) => (
                        <button
                            key={rating}
                            onClick={() => handleRatingChange(rating)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${currentRating === rating
                                    ? "bg-purple-50 border-2 border-purple-600"
                                    : "border border-gray-200 hover:bg-gray-50"
                                }`}
                        >
                            <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                    <svg
                                        key={i}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill={i < parseInt(rating) ? "currentColor" : "none"}
                                        stroke="currentColor"
                                        strokeWidth={i < parseInt(rating) ? 0 : 2}
                                        className={`w-4 h-4 ${i < parseInt(rating) ? "text-yellow-400" : "text-gray-300"
                                            }`}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                        />
                                    </svg>
                                ))}
                                <span className="ml-2 text-sm text-gray-700">& up</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
