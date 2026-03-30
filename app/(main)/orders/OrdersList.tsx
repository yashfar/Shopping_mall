"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@@/components/ui/button";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

type Order = {
    id: string;
    orderNumber?: string | null;
    total: number;
    status: string;
    createdAt: string;
    returnRequest?: { status: string } | null;
    items?: {
        product: {
            title: string;
            imageUrl?: string | null;
        };
        quantity: number;
    }[];
};

export default function OrdersList() {
    const t = useTranslations("orders");

    const STATUS_OPTIONS = [
        { value: "", label: t("all") },
        { value: "PENDING", label: t("pending") },
        { value: "PAID", label: t("paid") },
        { value: "SHIPPED", label: t("shipped") },
        { value: "COMPLETED", label: t("completed") },
        { value: "CANCELED", label: t("canceled") },
        { value: "RETURN_REQUESTED", label: t("returnRequested") },
        { value: "RETURNED", label: t("returned") },
    ];
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

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
            case "RETURN_REQUESTED":
                return `${base} bg-orange-50 text-orange-600 border-orange-100`;
            case "RETURNED":
                return `${base} bg-violet-50 text-violet-600 border-violet-100`;
            default:
                return `${base} bg-gray-50 text-gray-600 border-gray-100`;
        }
    };

    const getReturnBadge = (order: Order) => {
        if (!order.returnRequest) return null;
        if (order.returnRequest.status === "REJECTED") {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-500 border border-red-100 ml-1.5">
                    {t("returnRejected")}
                </span>
            );
        }
        if (order.returnRequest.status === "APPROVED") {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-500 border border-emerald-100 ml-1.5">
                    {t("refunded")}
                </span>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[#C8102E] rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-gray-400 font-medium animate-pulse">{t("loadingOrders")}</p>
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t("noOrders")}</h3>
                <p className="text-gray-500 max-w-sm mb-8">{t("noOrdersDescription")}</p>
                <Link href="/products">
                    <Button className="bg-[#C8102E] hover:bg-[#A00C24] text-white px-8 h-12 rounded-xl font-bold shadow-lg shadow-[#C8102E]/20 transition-all hover:scale-105 active:scale-95">
                        {t("startShopping")}
                    </Button>
                </Link>
            </div>
        );
    }

    const statusCounts = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const filteredOrders = orders.filter((order) => {
        const matchesSearch = searchTerm
            ? (order.orderNumber || order.id).toLowerCase().includes(searchTerm.toLowerCase())
            : true;
        const matchesStatus = statusFilter ? order.status === statusFilter : true;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Search & Filter */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-5 space-y-4">
                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t("searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-10 py-3 border border-gray-100 rounded-2xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all text-sm font-medium placeholder:text-gray-400"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Status Pills */}
                <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
                    {STATUS_OPTIONS.map((opt) => {
                        const count = opt.value ? (statusCounts[opt.value] || 0) : orders.length;
                        if (opt.value && count === 0) return null;
                        const isActive = statusFilter === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(isActive ? "" : opt.value)}
                                className={`group flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
                                    isActive
                                        ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-lg shadow-gray-900/10"
                                        : "bg-white text-gray-500 border-gray-200 hover:border-[#C8102E] hover:text-[#C8102E] hover:shadow-sm"
                                }`}
                            >
                                {opt.label}
                                <span className={`inline-flex items-center justify-center min-w-4.5 h-4.5 rounded-full text-[10px] font-black leading-none ${
                                    isActive
                                        ? "bg-white/20 text-white/80"
                                        : "bg-gray-100 text-gray-400 group-hover:bg-red-50 group-hover:text-[#C8102E]"
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Active filter info */}
            {(searchTerm || statusFilter) && (
                <div className="flex items-center justify-between px-1">
                    <p className="text-sm text-gray-500 font-medium">
                        <span className="font-black text-gray-900">{filteredOrders.length}</span> {t("ordersFound", { count: filteredOrders.length })}
                    </p>
                    <button
                        onClick={() => { setSearchTerm(""); setStatusFilter(""); }}
                        className="text-xs font-bold text-[#C8102E] hover:text-[#A90D27] transition-colors"
                    >
                        {t("clearAll")}
                    </button>
                </div>
            )}

            {/* Empty filter state */}
            {filteredOrders.length === 0 && (searchTerm || statusFilter) && (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <Search className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-base font-bold text-gray-900 mb-1">{t("noMatchingOrders")}</p>
                    <p className="text-sm text-gray-400">{t("tryDifferent")}</p>
                </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">{t("orderNumber")}</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">{t("date")}</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">{t("status")}</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">{t("action")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredOrders.map((order) => (
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
                                        {order.status.replace("_", " ")}
                                    </span>
                                    {getReturnBadge(order)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="font-black text-gray-900 text-lg">
                                        ${(order.total / 100).toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/orders/${order.id}`}>
                                        <Button variant="ghost" size="sm" className="font-bold text-gray-500 hover:text-[#C8102E] hover:bg-red-50">
                                            {t("viewDetails")}
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
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={getStatusStyles(order.status)}>
                                        {order.status.replace("_", " ")}
                                    </span>
                                    {getReturnBadge(order)}
                                </div>
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
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t("orderNumber")}</span>
                                <span className="font-bold text-gray-900 font-mono text-sm">
                                    {order.orderNumber || order.id.substring(0, 8).toUpperCase()}
                                </span>
                            </div>
                            <Link href={`/orders/${order.id}`}>
                                <Button size="sm" className="bg-[#1A1A1A] text-white rounded-lg font-bold text-xs px-4 h-9">
                                    {t("view")}
                                </Button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
