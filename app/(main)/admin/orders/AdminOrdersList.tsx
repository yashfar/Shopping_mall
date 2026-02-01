"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Order = {
    id: string;
    orderNumber?: string | null;
    total: number;
    status: string;
    createdAt: string;
    user: {
        email: string;
    };
};

type FilterOption = {
    label: string;
    value: string | null;
    description: string;
};

const FILTER_OPTIONS: FilterOption[] = [
    { label: "All Orders", value: null, description: "Show all orders" },
    { label: "Pending", value: "pending", description: "Payment not completed" },
    { label: "Ready to Ship", value: "ready_to_ship", description: "Paid, awaiting shipment" },
    { label: "Shipped", value: "shipped", description: "Order shipped" },
    { label: "Delivered", value: "delivered", description: "Order delivered" },
    { label: "Cancelled", value: "cancelled", description: "Order cancelled" },
];

type Props = {
    initialStatus?: string;
};

export default function AdminOrdersList({ initialStatus }: Props) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentStatus = searchParams.get("status") || initialStatus || null;
    const initialSearch = searchParams.get("search") || "";

    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
    const [sortConfig, setSortConfig] = useState("date_desc");
    const [isSortOpen, setIsSortOpen] = useState(false);

    // Debounce search input and reset state on change
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchQuery !== debouncedSearch) {
                setPage(1);
                setOrders([]);
                setHasMore(true);
                setDebouncedSearch(searchQuery);
            }
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery, debouncedSearch]);

    // Update URL when debounced search changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (debouncedSearch) {
            params.set("search", debouncedSearch);
        } else {
            params.delete("search");
        }

        // Only push if different from current
        if (params.toString() !== searchParams.toString()) {
            router.push(`/admin/orders?${params.toString()}`);
        }
    }, [debouncedSearch, router, searchParams]);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver | null>(null);

    const lastOrderElementRef = useCallback((node: HTMLDivElement | HTMLTableRowElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // Reset on filter change only
    useEffect(() => {
        setPage(1);
        setOrders([]);
        setHasMore(true);
    }, [currentStatus, sortConfig]);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (currentStatus) params.append("status", currentStatus);
                if (debouncedSearch) params.append("search", debouncedSearch);

                // Add sort params
                const [sort, order] = sortConfig.split("_");
                params.append("sort", sort);
                params.append("order", order);

                params.append("page", page.toString());
                params.append("limit", "15");

                const response = await fetch(`/api/admin/orders?${params.toString()}`);
                if (!response.ok) throw new Error("Failed to fetch orders");
                const data = await response.json();

                setOrders(prev => {
                    if (page === 1) return data.orders;
                    // Filter out duplicates based on ID to be safe
                    const newOrders = data.orders.filter((o: Order) => !prev.some(p => p.id === o.id));
                    return [...prev, ...newOrders];
                });
                setHasMore(data.hasMore);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [page, currentStatus, debouncedSearch, sortConfig]);

    const handleFilterChange = (filterValue: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (filterValue) {
            params.set("status", filterValue);
        } else {
            params.delete("status");
        }
        // Always reset to page 1 implicitly handled by effect but URL change triggers it
        router.push(`/admin/orders?${params.toString()}`);
    };

    const getStatusStyles = (status: string) => {
        const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border";
        switch (status) {
            case "PENDING":
                return `${base} bg-amber-50 text-amber-600 border-amber-100`;
            case "PAID":
                return `${base} bg-emerald-50 text-emerald-600 border-emerald-100`;
            case "SHIPPED":
                return `${base} bg-sky-50 text-sky-600 border-sky-100`;
            case "COMPLETED":
            case "DELIVERED":
                return `${base} bg-emerald-100 text-emerald-700 border-emerald-200`;
            case "CANCELED":
            case "CANCELLED":
                return `${base} bg-red-50 text-[#C8102E] border-red-100`;
            default:
                return `${base} bg-gray-50 text-gray-600 border-gray-100`;
        }
    };

    if (loading && page === 1) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[#C8102E] rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-gray-400 font-medium animate-pulse">Loading orders...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Toolbar Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden backdrop-blur-xl bg-opacity-90">
                <div className="p-6 md:p-8 space-y-8">
                    {/* Search Bar */}
                    <div className="relative max-w-3xl">
                        <label htmlFor="search" className="sr-only">Search Orders</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400 group-focus-within:text-[#C8102E] transition-colors">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <input
                                id="search"
                                type="text"
                                placeholder="Search by Order #, Customer Name, or Email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-12 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all placeholder:text-gray-400 hover:bg-gray-50"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#C8102E] transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-xs font-extrabold text-[#A9A9A9] uppercase tracking-widest ml-1">
                            Filter by Status
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {FILTER_OPTIONS.map((option) => {
                                const isActive = currentStatus === option.value;
                                return (
                                    <button
                                        key={option.value || "all"}
                                        onClick={() => handleFilterChange(option.value)}
                                        className={`
                                            group relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 w-[calc(50%-10px)] md:w-auto
                                            ${isActive
                                                ? "bg-[#1A1A1A] text-white shadow-lg shadow-[#1A1A1A]/20 scale-105"
                                                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                            }
                                        `}
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            {option.label}
                                            {isActive && (
                                                <span className="flex h-1.5 w-1.5 rounded-full bg-[#C8102E]"></span>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-bold text-[#1A1A1A] tracking-tight flex items-center gap-2">
                    {currentStatus
                        ? FILTER_OPTIONS.find((opt) => opt.value === currentStatus)?.label || "Filtered Orders"
                        : "All Orders"}
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs text-medium">
                        {orders.length}
                    </span>
                </h2>

                {/* Sort Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-[#C8102E] hover:text-[#C8102E] transition-all shadow-sm"
                    >
                        <span className="text-gray-400 font-medium">Sort by:</span>
                        <span>
                            {sortConfig === "date_desc" && "Date: Newest"}
                            {sortConfig === "date_asc" && "Date: Oldest"}
                            {sortConfig === "total_desc" && "Total: High to Low"}
                            {sortConfig === "total_asc" && "Total: Low to High"}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition-transform ${isSortOpen ? "rotate-180" : ""}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>

                    {isSortOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-1">
                                    {[
                                        { label: "Date: Newest", value: "date_desc" },
                                        { label: "Date: Oldest", value: "date_asc" },
                                        { label: "Total: High to Low", value: "total_desc" },
                                        { label: "Total: Low to High", value: "total_asc" },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setSortConfig(option.value);
                                                setIsSortOpen(false);
                                                setPage(1);
                                                setOrders([]);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg flex items-center justify-between group ${sortConfig === option.value
                                                ? "bg-[#C8102E]/5 text-[#C8102E]"
                                                : "text-gray-700 hover:bg-gray-50"
                                                }`}
                                        >
                                            {option.label}
                                            {sortConfig === option.value && (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-[#C8102E]">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Empty State */}
            {orders.length === 0 && (
                <div className="bg-white border border-gray-100 rounded-3xl p-20 text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No orders found</h3>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                        We couldn't find any orders matching your current filters. Try adjusting your search or filters.
                    </p>
                    {currentStatus && (
                        <button
                            onClick={() => handleFilterChange(null)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white font-bold rounded-xl hover:bg-[#333] transition-all transform hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}

            {/* Orders List */}
            {orders.length > 0 && (
                <>
                    {/* Desktop View */}
                    <div className="hidden md:block bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-100/50 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-6 text-[11px] font-black text-[#A9A9A9] uppercase tracking-widest">Order Details</th>
                                    <th className="px-8 py-6 text-[11px] font-black text-[#A9A9A9] uppercase tracking-widest">Customer</th>
                                    <th className="px-8 py-6 text-[11px] font-black text-[#A9A9A9] uppercase tracking-widest text-center">Status</th>
                                    <th className="px-8 py-6 text-[11px] font-black text-[#A9A9A9] uppercase tracking-widest text-right">Total</th>
                                    <th className="px-8 py-6 text-[11px] font-black text-[#A9A9A9] uppercase tracking-widest text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.map((order, index) => {
                                    const isLastOrder = orders.length === index + 1;
                                    return (
                                        <tr
                                            key={order.id}
                                            ref={isLastOrder ? lastOrderElementRef : null}
                                            className="hover:bg-gray-50/80 transition-all duration-200 group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-[#C8102E]/10 group-hover:text-[#C8102E] transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="font-mono font-bold text-[#1A1A1A] group-hover:text-[#C8102E] transition-colors">
                                                            {order.orderNumber ? `#${order.orderNumber}` : `#${order.id.substring(0, 8)}...`}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1 font-medium">
                                                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                                                                year: "numeric", month: "short", day: "numeric"
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-bold text-[#1A1A1A]">{order.user.email}</div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={getStatusStyles(order.status)}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="font-black text-[#1A1A1A] text-lg">
                                                    ${(order.total / 100).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95 shadow-sm group/btn"
                                                >
                                                    Details
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-gray-400 group-hover/btn:text-white transition-colors">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                    </svg>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden grid gap-4 grid-cols-1 sm:grid-cols-2">
                        {orders.map((order, index) => {
                            const isLastOrder = orders.length === index + 1;
                            return (
                                <div
                                    key={order.id}
                                    ref={isLastOrder ? lastOrderElementRef : null}
                                    className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <span className="font-mono font-bold text-[#1A1A1A] text-sm block">
                                                    {order.orderNumber ? `#${order.orderNumber}` : `#${order.id.substring(0, 8)}...`}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                                                        month: "short", day: "numeric"
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`${getStatusStyles(order.status)} scale-90 origin-right`}>
                                            {order.status}
                                        </span>
                                    </div>

                                    <div>
                                        <p className="font-medium text-[#1A1A1A] text-sm truncate">{order.user.email}</p>
                                    </div>

                                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest block">Total</span>
                                            <p className="text-lg font-black text-[#C8102E]">${(order.total / 100).toFixed(2)}</p>
                                        </div>
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-bold rounded-lg hover:bg-[#333] active:scale-95 transition-all"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Load More Spinner */}
            {loading && page > 1 && (
                <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-[#C8102E]/20 border-t-[#C8102E] rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
