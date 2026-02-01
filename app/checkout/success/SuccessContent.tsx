"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@@/components/ui/button";

type OrderItem = {
    id: string;
    quantity: number;
    price: number;
    product: {
        title: string;
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

export default function SuccessContent({ orderId }: { orderId: string }) {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            // Simulate loading for smoother UX
            await new Promise(resolve => setTimeout(resolve, 500));
            try {
                const response = await fetch(`/api/orders/${orderId}`);
                if (!response.ok) throw new Error("Failed to fetch order");
                const data = await response.json();
                setOrder(data.order);
            } catch (error) {
                console.error("Error fetching order:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[#C8102E] rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-gray-400 font-medium animate-pulse">Confirming your order...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-red-50 p-6 rounded-full mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-[#C8102E]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h3>
                <p className="text-gray-500 max-w-sm mb-8">We couldn't find the order you're looking for. It might have been processed or the ID is incorrect.</p>
                <Link href="/orders">
                    <Button variant="outline" className="border-gray-200 text-gray-900 hover:bg-gray-50">
                        View All Orders
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-10">
            {/* Success Message */}
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-2 animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12 text-emerald-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Payment Successful!</h1>
                    <p className="text-gray-500 mt-2 text-lg">Thank you for your purchase. Your order has been confirmed.</p>
                </div>
                <p className="text-sm font-bold bg-gray-50 px-4 py-2 rounded-full text-gray-600 border border-gray-100">
                    Order #{order.orderNumber || order.id.substring(0, 8)}
                </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/30">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
                            <p className="font-bold text-gray-900">
                                {new Date(order.createdAt).toLocaleDateString("en-US", {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                })}
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                                {order.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-gray-100">
                    <div className="p-6 md:p-8">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Items Purchased</h3>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{item.product.title}</p>
                                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-gray-900">${((item.price * item.quantity) / 100).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 md:p-8">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-500 font-medium">Subtotal</span>
                            <span className="font-bold text-gray-900">${(order.total / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-500 font-medium">Shipping</span>
                            <span className="font-bold text-green-600">Free</span>
                        </div>
                        <div className="pt-4 border-t border-gray-200 border-dashed flex justify-between items-center">
                            <span className="font-black text-gray-900 text-lg">Total Paid</span>
                            <span className="font-black text-[#C8102E] text-2xl">${(order.total / 100).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/orders" className="w-full sm:w-auto">
                    <Button className="w-full h-12 px-8 bg-[#1A1A1A] hover:bg-black text-white font-bold rounded-xl shadow-lg shadow-black/20 transition-all hover:scale-105 active:scale-95">
                        View Order History
                    </Button>
                </Link>
                <Link href="/products" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full h-12 px-8 bg-white border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95">
                        Continue Shopping
                    </Button>
                </Link>
            </div>
        </div>
    );
}
