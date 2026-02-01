"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminNavbarLink() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await fetch("/api/admin/new-orders-count");
                if (res.ok) {
                    const data = await res.json();
                    setCount(data.count || 0);
                }
            } catch (error) {
                console.error("Failed to fetch order count", error);
            }
        };

        // Initial fetch
        fetchCount();

        // Poll every 20 seconds
        const intervalId = setInterval(fetchCount, 20000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <Link
            href="/admin"
            className="no-underline text-[#1A1A1A] font-semibold text-[0.95rem] transition-all duration-200 hover:text-[#C8102E] relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#C8102E] after:transition-all after:duration-300 hover:after:w-full group"
        >
            Admin
            {count > 0 && (
                <span className="absolute -top-3 -right-4 bg-purple-600 text-white text-[0.7rem] font-bold px-1.5 py-1.5 rounded-full min-w-[16px] h-[21px] flex items-center justify-center shadow-sm border border-white leading-none animate-in fade-in zoom-in duration-300">
                    {count}
                </span>
            )}
        </Link>
    );
}
