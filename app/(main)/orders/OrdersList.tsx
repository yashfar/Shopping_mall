"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@@/components/ui/button";

type Order = {
    id: string;
    orderNumber?: string | null;
    total: number;
    status: string;
    createdAt: string;
    items?: {
        product: {
            title: string;
            imageUrl?: string | null;
        };
        quantity: number;
    }[];
};

export default function OrdersList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            // Simulate loading for better UX
            await new Promise(resolve => setTimeout(resolve, 500));
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

    if (loading) {
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

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50">
                <div className="bg-gray-50 p-6 rounded-full mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500 max-w-sm mb-8">You haven't placed any orders yet. Start shopping to see your orders here.</p>
                <Link href="/products">
                    <Button className="bg-[#C8102E] hover:bg-[#A00C24] text-white px-8 h-12 rounded-xl font-bold shadow-lg shadow-[#C8102E]/20 transition-all hover:scale-105 active:scale-95">
                        Start Shopping
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Order #</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Date</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders.map((order) => (
                            <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 font-mono">
                                            {order.orderNumber || order.id.substring(0, 8).toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-400 hidden group-hover:block transition-all">
                                            ID: {order.id}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-sm font-medium text-gray-600">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={getStatusStyles(order.status)}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="font-black text-gray-900 text-lg">
                                        ${(order.total / 100).toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/orders/${order.id}`}>
                                        <Button variant="ghost" size="sm" className="font-bold text-gray-500 hover:text-[#C8102E] hover:bg-red-50">
                                            View Details
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </Button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Grid View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {orders.map((order) => (
                    <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className={getStatusStyles(order.status)}>
                                    {order.status}
                                </span>
                                <p className="text-xs text-gray-400 mt-2 font-medium">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <span className="font-black text-gray-900 text-xl">
                                ${(order.total / 100).toFixed(2)}
                            </span>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Order #</span>
                                <span className="font-bold text-gray-900 font-mono text-sm">
                                    {order.orderNumber || order.id.substring(0, 8).toUpperCase()}
                                </span>
                            </div>
                            <Link href={`/orders/${order.id}`}>
                                <Button size="sm" className="bg-[#1A1A1A] text-white rounded-lg font-bold text-xs px-4 h-9">
                                    View
                                </Button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
