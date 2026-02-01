"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@@/components/ui/button";

type OrderItem = {
    id: string;
    quantity: number;
    price: number;
    product: {
        id: string;
        title: string;
        description: string | null;
        thumbnail?: string | null;
    };
};

type Order = {
    id: string;
    orderNumber?: string | null;
    total: number;
    status: string;
    createdAt: string;
    items: OrderItem[];
};

export default function OrderDetails({ orderId }: { orderId: string }) {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOrder = async () => {
            // Simulate a small delay for smoother transition
            await new Promise(resolve => setTimeout(resolve, 300));
            try {
                const response = await fetch(`/api/orders/${orderId}`);
                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error("You don't have permission to view this order");
                    }
                    throw new Error("Failed to fetch order");
                }
                const data = await response.json();
                setOrder(data.order);
            } catch (err: any) {
                setError(err.message || "Failed to load order");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    const getStatusStyles = (status: string) => {
        const base = "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border";
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
                <p className="text-gray-400 font-medium animate-pulse">Retrieving order details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center max-w-lg mx-auto shadow-sm my-10">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#C8102E] mx-auto mb-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <h3 className="text-lg font-bold text-[#C8102E] mb-2">Error Loading Order</h3>
                <p className="text-red-600/80 mb-6">{error}</p>
                <Link href="/orders">
                    <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">
                        Back to Orders
                    </Button>
                </Link>
            </div>
        );
    }

    if (!order) {
        return <div className="text-center py-20 text-gray-400 font-bold">Order not found</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20 animate-in fade-in duration-500">
            {/* Left Column - Main Content (2/3 width) */}
            <div className="lg:col-span-2 space-y-8">
                {/* Order Summary Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            Order Items
                        </h2>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{order.items.length} ITEMS</span>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {order.items.map((item) => (
                            <div key={item.id} className="p-6 transition-colors hover:bg-gray-50/50">
                                <div className="flex flex-col sm:flex-row gap-6">
                                    {/* Product Image */}
                                    <div className="w-full sm:w-24 h-24 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                                        {item.product.thumbnail ? (
                                            <img
                                                src={item.product.thumbnail}
                                                alt={item.product.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-900 text-base sm:text-lg">{item.product.title}</h3>
                                                <p className="font-black text-gray-900 text-lg sm:text-xl">
                                                    ${((item.price * item.quantity) / 100).toFixed(2)}
                                                </p>
                                            </div>
                                            {item.product.description && (
                                                <p className="text-sm text-gray-500 line-clamp-2 max-w-xl">{item.product.description}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100/50">
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                                                <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Qty</span>
                                                <span className="font-bold text-gray-900">{item.quantity}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                                                <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Unit Price</span>
                                                <span className="font-medium text-gray-600">${(item.price / 100).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gray-50 p-6 border-t border-gray-100">
                        <div className="flex flex-col gap-2 max-w-xs ml-auto">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Subtotal</span>
                                <span className="font-bold text-gray-900">${(order.total / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Shipping</span>
                                <span className="font-bold text-gray-900 text-green-600">Free</span>
                            </div>
                            <div className="my-2 border-t border-gray-200 border-dashed"></div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-black text-gray-900">Total Paid</span>
                                <span className="font-black text-[#C8102E] text-2xl">${(order.total / 100).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Sidebar (1/3 width) */}
            <div className="space-y-6">

                {/* Status Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 pointer-events-none">
                        {(order.status === "COMPLETED" || order.status === "DELIVERED") ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 text-emerald-500/10 rotate-12">
                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                            </svg>
                        ) : (order.status === "CANCELED" || order.status === "CANCELLED") ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 text-red-500/10 rotate-12">
                                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 text-gray-900/5 rotate-12 transition-colors">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>

                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Order Status</h3>

                    <div className="mb-6">
                        <span className={getStatusStyles(order.status)}>
                            {order.status}
                        </span>
                        <p className="text-xs text-gray-400 mt-2 font-medium">
                            Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Reference</label>
                        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-900 font-mono font-bold border border-gray-100 flex items-center justify-between group cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => {
                                navigator.clipboard.writeText(order.orderNumber || order.id);
                            }}
                            title="Click to copy Order ID"
                        >
                            {order.orderNumber || order.id.substring(0, 8)}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-gray-400 group-hover:text-gray-900">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Need Help Card */}
                <div className="bg-[#1A1A1A] rounded-3xl p-6 text-white shadow-xl shadow-[#1A1A1A]/20">
                    <h3 className="text-sm font-bold text-white mb-2">Need Help?</h3>
                    <p className="text-xs text-gray-400 mb-6">If you have any issues with your order, please contact our support team.</p>
                    <Link href="/contact" className="block">
                        <Button variant="outline" className="w-full bg-white/10 border-white/10 text-white hover:bg-white hover:text-black hover:border-white transition-all">
                            Contact Support
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
