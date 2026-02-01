"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@@/components/ui/select";

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

type User = {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
};

type Address = {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    district: string;
    neighborhood: string;
    fullAddress: string;
} | null;

type Order = {
    id: string;
    orderNumber?: string | null;
    total: number;
    status: string;
    createdAt: string;
    user?: User | null;
    items?: OrderItem[];
};

const STATUS_MAP: Record<string, string> = {
    pending: "PENDING",
    ready_to_ship: "PAID",
    shipped: "SHIPPED",
    delivered: "COMPLETED",
    cancelled: "CANCELED",
};

const REVERSE_STATUS_MAP: Record<string, string> = {
    PENDING: "pending",
    PAID: "ready_to_ship",
    SHIPPED: "shipped",
    COMPLETED: "delivered",
    CANCELED: "cancelled",
};

export default function AdminOrderDetails({ orderId }: { orderId: string }) {
    const [order, setOrder] = useState<Order | null>(null);
    const [address, setAddress] = useState<Address>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("");
    const [updating, setUpdating] = useState(false);
    const [downloading, setDownloading] = useState<"invoice" | "label" | null>(null);

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`);
            if (!response.ok) throw new Error("Failed to fetch order");
            const data = await response.json();
            setOrder(data.order);
            setAddress(data.address);
            setSelectedStatus(REVERSE_STATUS_MAP[data.order.status] || "pending");
        } catch (err: any) {
            setError(err.message || "Failed to load order");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!selectedStatus || !order) return;

        setUpdating(true);
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: STATUS_MAP[selectedStatus] }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update status");
            }

            const data = await response.json();
            setOrder(data.order);
            toast.success("Order status updated successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    const handleDownloadInvoice = async () => {
        setDownloading("invoice");
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/invoice`);
            if (!response.ok) throw new Error("Failed to generate invoice");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `invoice-${orderId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Invoice downloaded successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to download invoice");
        } finally {
            setDownloading(null);
        }
    };

    const handleDownloadShippingLabel = async () => {
        setDownloading("label");
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/shipping-label`);
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to generate shipping label");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `shipping-label-${orderId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Shipping label downloaded successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to download shipping label");
        } finally {
            setDownloading(null);
        }
    };

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
                <p className="text-gray-400 font-medium animate-pulse">Loading details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center max-w-lg mx-auto shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#C8102E] mx-auto mb-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <h3 className="text-lg font-bold text-[#C8102E] mb-2">Error Loading Order</h3>
                <p className="text-red-600/80">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="mt-6 border-red-200 text-red-700 hover:bg-red-100">
                    Try Again
                </Button>
            </div>
        );
    }

    if (!order) {
        return <div className="text-center py-20 text-gray-400 font-bold">Order not found</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20 animate-in fade-in duration-500 delay-150">
            {/* Left Column - Main Content (2/3 width) */}
            <div className="lg:col-span-2 space-y-8">
                {/* Order Summary Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                        <h2 className="text-lg font-black text-[#1A1A1A] tracking-tight flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            Order Items
                        </h2>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{order.items?.length || 0} ITEMS</span>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {(order.items || []).map((item) => (
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
                                                <h3 className="font-bold text-[#1A1A1A] text-base sm:text-lg">{item.product.title}</h3>
                                                <p className="font-black text-[#1A1A1A] text-lg sm:text-xl">
                                                    ${((item.price * item.quantity) / 100).toFixed(2)}
                                                </p>
                                            </div>
                                            {item.product.description && (
                                                <p className="text-sm text-gray-500 line-clamp-2 max-w-xl">{item.product.description}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100/50">
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                                                <span className="text-[10px] uppercase font-black text-[#A9A9A9] tracking-widest">Qty</span>
                                                <span className="font-bold text-[#1A1A1A]">{item.quantity}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                                                <span className="text-[10px] uppercase font-black text-[#A9A9A9] tracking-widest">Unit Price</span>
                                                <span className="font-medium text-gray-600">${(item.price / 100).toFixed(2)}</span>
                                            </div>
                                            <div className="ml-auto text-[10px] text-gray-400 font-mono">
                                                ID: {item.product.id.substring(0, 8)}...
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
                                <span className="font-black text-[#1A1A1A]">Total</span>
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
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 text-gray-900/5 rotate-12">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>

                    <h3 className="text-sm font-black text-[#A9A9A9] uppercase tracking-widest mb-4">Order Status</h3>

                    <div className="mb-6">
                        <span className={getStatusStyles(order.status)}>
                            {order.status}
                        </span>
                        <p className="text-xs text-gray-400 mt-2 font-medium">
                            Updated on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-900 block">Change Status</label>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-full bg-white border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-[#C8102E]/20">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="pending">Pending Payment</SelectItem>
                                <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={handleStatusUpdate}
                            disabled={updating || selectedStatus === REVERSE_STATUS_MAP[order.status]}
                            className="w-full bg-[#1A1A1A] hover:bg-[#333] text-white font-bold rounded-xl py-6 transition-all active:scale-95"
                        >
                            {updating ? "Updating..." : "Update Status"}
                        </Button>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-6">
                    <h3 className="text-sm font-black text-[#A9A9A9] uppercase tracking-widest mb-6">Customer Details</h3>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg border-2 border-white shadow-sm">
                            {order.user?.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold text-[#1A1A1A] truncate">{order.user?.firstName || "Guest"} {order.user?.lastName || "User"}</p>
                            <p className="text-xs text-gray-500 truncate">{order.user?.email}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Contact Info</span>
                            <div className="bg-gray-50 rounded-xl p-3 text-sm text-[#1A1A1A] font-medium border border-gray-100">
                                {order.user?.phone || "No phone provided"}
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Order #</span>
                            <div className="bg-gray-50 rounded-xl p-3 text-sm text-[#1A1A1A] font-mono font-bold border border-gray-100 flex items-center justify-between group cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => {
                                    navigator.clipboard.writeText(order.orderNumber || order.id);
                                    toast.success("Order ID copied");
                                }}
                            >
                                {order.orderNumber || order.id.substring(0, 8)}
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-gray-400 group-hover:text-[#1A1A1A]">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-6">
                    <h3 className="text-sm font-black text-[#A9A9A9] uppercase tracking-widest mb-4">Shipping Address</h3>

                    {address ? (
                        <div className="relative">
                            <div className="absolute left-[3px] top-2 bottom-2 w-0.5 bg-gray-100"></div>
                            <div className="space-y-4 relative">
                                <div className="flex gap-3">
                                    <div className="w-2 h-2 rounded-full bg-[#C8102E] mt-2 flex-shrink-0"></div>
                                    <div>
                                        <p className="text-sm font-bold text-[#1A1A1A]">{address.firstName} {address.lastName}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 flex-shrink-0"></div>
                                    <div>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {address.fullAddress}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 flex-shrink-0"></div>
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            {address.city}, {address.district}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">{address.neighborhood}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3 items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0">
                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="text-sm font-bold text-amber-800">No Address</p>
                                <p className="text-xs text-amber-600 mt-1">This order does not have shipping address information.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions / Downloads */}
                <div className="space-y-3">
                    <Button
                        onClick={handleDownloadInvoice}
                        disabled={downloading === "invoice"}
                        variant="outline"
                        className="w-full justify-center h-12 font-bold bg-white hover:bg-gray-50 border-gray-200 text-[#1A1A1A] rounded-xl hover:shadow-md transition-all"
                    >
                        {downloading === "invoice" ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        )}
                        Download Invoice
                    </Button>
                    <Button
                        onClick={handleDownloadShippingLabel}
                        disabled={downloading === "label" || !address}
                        variant="outline"
                        className="w-full justify-center h-12 font-bold bg-white hover:bg-gray-50 border-gray-200 text-[#1A1A1A] rounded-xl hover:shadow-md transition-all"
                    >
                        {downloading === "label" ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                            </svg>
                        )}
                        Shipping Label
                    </Button>
                </div>
            </div>
        </div>
    );
}
