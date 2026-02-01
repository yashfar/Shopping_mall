"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Order = {
    id: string;
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
    { label: "Pending Payment", value: "pending", description: "Payment not completed" },
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

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const url = currentStatus
                    ? `/api/admin/orders?status=${currentStatus}`
                    : "/api/admin/orders";
                const response = await fetch(url);
                if (!response.ok) throw new Error("Failed to fetch orders");
                const data = await response.json();
                setOrders(data.orders);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [currentStatus]);

    const handleFilterChange = (filterValue: string | null) => {
        if (filterValue) {
            router.push(`/admin/orders?status=${filterValue}`);
        } else {
            router.push("/admin/orders");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-[#C8102E]/20 border-t-[#C8102E] rounded-full animate-spin" />
                <p className="text-[#A9A9A9] font-semibold tracking-tight">Loading orders...</p>
            </div>
        );
    }

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "PENDING":
                return "bg-amber-50 text-amber-600 border-amber-100";
            case "PAID":
                return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case "SHIPPED":
                return "bg-sky-50 text-sky-600 border-sky-100";
            case "COMPLETED":
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "CANCELED":
                return "bg-red-50 text-[#C8102E] border-red-100";
            default:
                return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    return (
        <div className="space-y-6">
            {/* Filter Buttons */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-black text-[#A9A9A9] uppercase tracking-widest">
                        Filter Orders
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {FILTER_OPTIONS.map((option) => {
                            const isActive = currentStatus === option.value;
                            return (
                                <button
                                    key={option.value || "all"}
                                    onClick={() => handleFilterChange(option.value)}
                                    className={`
                                        group relative px-5 py-3 rounded-xl font-bold text-sm
                                        transition-all duration-200 active:scale-95
                                        ${isActive
                                            ? "bg-[#1A1A1A] text-white shadow-lg shadow-[#1A1A1A]/20"
                                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                                        }
                                    `}
                                >
                                    <span className="relative z-10">{option.label}</span>
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A] to-[#333] rounded-xl" />
                                    )}
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {option.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Order Count */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-[#1A1A1A]">
                    {currentStatus
                        ? FILTER_OPTIONS.find((opt) => opt.value === currentStatus)?.label ||
                        "Filtered Orders"
                        : "All Orders"}{" "}
                    <span className="text-[#A9A9A9] ml-2 text-lg">({orders.length})</span>
                </h2>
            </div>

            {/* Empty State */}
            {orders.length === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-3xl p-20 text-center">
                    <p className="text-gray-500 font-bold text-lg">
                        No orders found
                        {currentStatus && " for this filter"}
                    </p>
                    {currentStatus && (
                        <button
                            onClick={() => handleFilterChange(null)}
                            className="mt-4 px-6 py-2 bg-[#1A1A1A] text-white font-bold rounded-xl hover:bg-[#333] transition-all"
                        >
                            View All Orders
                        </button>
                    )}
                </div>
            )}

            {/* Mobile List View */}
            {orders.length > 0 && (
                <div className="md:hidden space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest block mb-1">Order ID</span>
                                    <span className="font-mono font-bold text-[#1A1A1A] text-sm bg-gray-50 px-2 py-1 rounded">#{order.id.substring(0, 8)}...</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black border tracking-widest ${getStatusStyles(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>

                            <div>
                                <span className="text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest block mb-1">Customer</span>
                                <p className="font-bold text-[#1A1A1A]">{order.user.email}</p>
                            </div>

                            <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                                <div>
                                    <span className="text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest block mb-1">Date</span>
                                    <p className="text-sm font-medium text-gray-500">
                                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                                            month: "short", day: "numeric"
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest block mb-1">Total</span>
                                    <p className="text-xl font-black text-[#C8102E]">${(order.total / 100).toFixed(2)}</p>
                                </div>
                            </div>

                            <Link
                                href={`/admin/orders/${order.id}`}
                                className="block w-full py-3 text-center bg-[#1A1A1A] text-white font-bold rounded-xl hover:bg-[#333] active:scale-95 transition-all"
                            >
                                View Details
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Desktop Table View */}
            {orders.length > 0 && (
                <div className="hidden md:block bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-8 py-5 text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest">Order Details</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest">Customer</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest text-right">Total</th>
                                <th className="px-8 py-5 text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="font-mono font-bold text-[#1A1A1A] text-sm">#{order.id.substring(0, 8)}...</div>
                                        <div className="text-xs text-gray-400 mt-1 font-medium">
                                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                                                year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-[#1A1A1A]">{order.user.email}</div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border tracking-widest inline-block ${getStatusStyles(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-[#C8102E]">
                                        ${(order.total / 100).toFixed(2)}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                                        >
                                            View
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-gray-400 group-hover:text-[#1A1A1A]">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
