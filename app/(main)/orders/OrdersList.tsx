"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
    id: string;
    total: number;
    status: string;
    createdAt: string;
};

export default function OrdersList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch("/api/orders");
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
                <p className="text-[#A9A9A9] font-semibold">Fetching your orders...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-[#A9A9A9] p-16 text-center shadow-sm max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-[#FAFAFA] rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-[#A9A9A9]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-black text-[#1A1A1A] mb-4">No Orders Found</h2>
                <p className="text-[#A9A9A9] font-medium mb-8">It looks like you haven't placed any orders yet. Start exploring our collection!</p>
                <a
                    href="/products"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#C8102E] text-white rounded-xl font-black transition-all hover:bg-[#A90D27] hover:shadow-[0_8px_20px_rgba(200,16,46,0.3)] active:scale-95"
                >
                    Browse Collection
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </a>
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
        <div className="bg-white rounded-2xl border border-[#A9A9A9] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#FAFAFA] border-b border-[#A9A9A9]/20">
                            <th className="px-8 py-5 text-xs font-black text-[#A9A9A9] uppercase tracking-widest">Order ID</th>
                            <th className="px-8 py-5 text-xs font-black text-[#A9A9A9] uppercase tracking-widest text-right">Investment</th>
                            <th className="px-8 py-5 text-xs font-black text-[#A9A9A9] uppercase tracking-widest text-center">Current Status</th>
                            <th className="px-8 py-5 text-xs font-black text-[#A9A9A9] uppercase tracking-widest">Transaction Date</th>
                            <th className="px-8 py-5 text-xs font-black text-[#A9A9A9] uppercase tracking-widest text-right">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#A9A9A9]/10">
                        {orders.map((order) => (
                            <tr key={order.id} className="transition-colors hover:bg-red-50/20 group">
                                <td className="px-8 py-6">
                                    <span className="text-xs font-mono font-bold text-[#A9A9A9] bg-[#FAFAFA] px-2 py-1 rounded">
                                        {order.id.substring(0, 12)}...
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right font-black text-[#C8102E] text-lg">
                                    ${(order.total / 100).toFixed(2)}
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-black border tracking-wider ${getStatusStyles(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-[#A9A9A9] font-medium text-sm">
                                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <Link
                                        href={`/orders/${order.id}`}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#A9A9A9] text-[#1A1A1A] font-bold rounded-xl hover:border-[#C8102E] hover:text-[#C8102E] transition-all duration-300 shadow-sm group-hover:shadow-md"
                                    >
                                        View Order
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
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
