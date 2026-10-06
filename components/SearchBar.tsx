"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function SearchBar() {
    const router = useRouter();
    const t = useTranslations("common");
    const [query, setQuery] = useState("");

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex-1 max-w-2xl group">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("search")}
                    className="h-10 w-full rounded-full border border-[#e9e1d8] bg-[#f7f4f0] py-2 pl-10 pr-4 text-sm font-medium text-[#1A1A1A] transition-all duration-300 placeholder:text-[#9c948c] focus:border-[#C8102E]/45 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#C8102E]/5"
                />
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#A9A9A9] group-focus-within:text-[#C8102E] transition-colors"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                </svg>
            </div>
        </form>
    );
}
