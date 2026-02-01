"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
    id: string;
    total: number;
    status: string;
    createdAt: string;
    user: {
        email: string;
    };
};

export default function AdminOrdersList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch("/api/admin/orders");
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
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-[#C8102E]/20 border-t-[#C8102E] rounded-full animate-spin" />
                <p className="text-[#A9A9A9] font-semibold tracking-tight">Loading orders...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-3xl p-20 text-center">
                <p className="text-gray-500 font-bold text-lg">No orders found</p>
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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-[#1A1A1A]">
                    All Orders <span className="text-[#A9A9A9] ml-2 text-lg">({orders.length})</span>
                </h2>
            </div>

            {/* Mobile List View */}
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

            {/* Desktop Table View */}
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
        </div>
    );
}
