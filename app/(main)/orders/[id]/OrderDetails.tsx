"use client";

import { useEffect, useState } from "react";

type OrderItem = {
    id: string;
    quantity: number;
    price: number;
    product: {
        id: string;
        title: string;
        description: string | null;
    };
};

type Order = {
    id: string;
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-[#C8102E]/20 border-t-[#C8102E] rounded-full animate-spin" />
                <p className="text-[#A9A9A9] font-semibold tracking-tight">Retrieving order details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-[#C8102E]/20 p-8 rounded-2xl text-center max-w-lg mx-auto">
                <p className="text-[#C8102E] font-black">{error}</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-20 text-[#A9A9A9] font-bold">Order not found</div>
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
        <div className="space-y-8 pb-20">
            {/* Header / Info Section */}
            <div className="bg-white rounded-3xl border border-[#A9A9A9] p-8 md:p-12 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,rgba(200,16,46,0.03)_0%,transparent_70%)] pointer-events-none" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#A9A9A9] uppercase tracking-[0.2em]">Transaction ID</label>
                        <p className="text-sm font-mono font-bold text-[#1A1A1A] bg-[#FAFAFA] px-2 py-1 rounded inline-block">#{order.id}</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#A9A9A9] uppercase tracking-[0.2em]">Package Status</label>
                        <div>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border tracking-widest ${getStatusStyles(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#A9A9A9] uppercase tracking-[0.2em]">Placed On</label>
                        <p className="text-sm font-bold text-[#1A1A1A]">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                            })}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#A9A9A9] uppercase tracking-[0.2em]">Grand Total</label>
                        <p className="text-3xl font-black text-[#C8102E] leading-none">
                            ${(order.total / 100).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Order Items Table */}
            <div className="bg-white rounded-3xl border border-[#A9A9A9] shadow-sm overflow-hidden">
                <div className="px-8 py-6 bg-[#FAFAFA] border-b border-[#A9A9A9]/20">
                    <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight">Order Contents</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#A9A9A9]/10">
                                <th className="px-8 py-4 text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest">Product Description</th>
                                <th className="px-8 py-4 text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest text-center">Qty</th>
                                <th className="px-8 py-4 text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest text-right">Unit Price</th>
                                <th className="px-8 py-4 text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest text-right">Extended Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#A9A9A9]/10">
                            {order.items.map((item) => (
                                <tr key={item.id} className="hover:bg-red-50/10 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-[#1A1A1A] text-lg">{item.product.title}</div>
                                        {item.product.description && (
                                            <p className="text-sm text-[#A9A9A9] mt-1 font-medium line-clamp-1">{item.product.description}</p>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-center font-bold text-[#1A1A1A]">
                                        {item.quantity}
                                    </td>
                                    <td className="px-8 py-6 text-right font-medium text-[#1A1A1A]">
                                        ${(item.price / 100).toFixed(2)}
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-[#1A1A1A]">
                                        ${((item.price * item.quantity) / 100).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-[#FAFAFA]/50 font-black">
                                <td colSpan={3} className="px-8 py-8 text-right text-[#1A1A1A] text-lg tracking-tight">
                                    Total Investment
                                </td>
                                <td className="px-8 py-8 text-right text-3xl text-[#C8102E]">
                                    ${(order.total / 100).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="flex justify-center pt-8">
                <a
                    href="/orders"
                    className="px-8 py-4 border-2 border-[#A9A9A9] text-[#1A1A1A] font-black rounded-2xl hover:border-[#1A1A1A] hover:bg-[#FAFAFA] transition-all flex items-center gap-3 active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Return to Orders History
                </a>
            </div>
        </div>
    );
}
