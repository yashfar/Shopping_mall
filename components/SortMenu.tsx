"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const sortOptions = [
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "rating_desc", label: "Highest Rating" },
    { value: "reviews_desc", label: "Most Reviewed" },
];

export default function SortMenu() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentSort = searchParams.get("sort") || "newest";
    const currentLabel =
        sortOptions.find((opt) => opt.value === currentSort)?.label || "Newest First";

    const handleSortChange = (sortValue: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", sortValue);
        router.push(`?${params.toString()}`);
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group flex items-center gap-2.5 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-[#1A1A1A] font-bold transition-all duration-300 hover:border-[#C8102E] hover:text-[#C8102E] shadow-sm hover:shadow-md active:scale-95"
            >
                <span className="p-1.5 bg-gray-50 rounded-full group-hover:bg-red-50 text-gray-400 group-hover:text-[#C8102E] transition-colors">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                        />
                    </svg>
                </span>
                <span className="hidden sm:inline text-gray-400 font-medium whitespace-nowrap">Sort by:</span>
                <span className="whitespace-nowrap">{currentLabel}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className={`w-4 h-4 text-gray-400 transition-transform group-hover:text-[#C8102E] ${isOpen ? "rotate-180 text-[#C8102E]" : ""}`}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-200 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 p-1.5">
                    {sortOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value)}
                            className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-all duration-200 mb-0.5 ${currentSort === option.value
                                ? "bg-red-50 text-[#C8102E] font-bold"
                                : "text-[#1A1A1A] font-medium hover:bg-gray-50 hover:text-[#C8102E]"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                {option.label}
                                {currentSort === option.value && (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="w-5 h-5 text-[#C8102E]"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
