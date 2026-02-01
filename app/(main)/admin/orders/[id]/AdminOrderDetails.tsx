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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-[#C8102E]/20 border-t-[#C8102E] rounded-full animate-spin" />
                <p className="text-[#A9A9A9] font-semibold tracking-tight">Loading details...</p>
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
        return <div className="text-center py-20 text-[#A9A9A9] font-bold">Order not found</div>;
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
            {/* Header / Info Section */}
            <div className="bg-white rounded-3xl border border-[#A9A9A9] p-6 md:p-8 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,rgba(200,16,46,0.03)_0%,transparent_70%)] pointer-events-none" />

                <h2 className="text-xl font-black text-[#1A1A1A] mb-6 border-b border-gray-100 pb-4">Order Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#A9A9A9] uppercase tracking-[0.2em] block">Order ID</label>
                        <p className="text-sm font-mono font-bold text-[#1A1A1A] bg-[#FAFAFA] px-2 py-1 rounded inline-block">#{order.id}</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#A9A9A9] uppercase tracking-[0.2em] block">Current Status</label>
                        <div>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border tracking-widest inline-block ${getStatusStyles(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#A9A9A9] uppercase tracking-[0.2em] block">Customer</label>
                        <p className="font-bold text-[#1A1A1A]">{order.user?.email || "N/A"}</p>
                        <p className="text-[10px] text-gray-400 font-mono">ID: {order.user?.id?.substring(0, 8) || "N/A"}...</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#A9A9A9] uppercase tracking-[0.2em] block">Order Date</label>
                        <p className="text-sm font-bold text-[#1A1A1A]">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Status Update & Actions Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Update Card */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-black text-[#1A1A1A] mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#C8102E]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Update Order Status
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-600 mb-2 block">Select New Status</label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending Payment</SelectItem>
                                    <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
                                    <SelectItem value="shipped">Shipped</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleStatusUpdate}
                            disabled={updating || selectedStatus === REVERSE_STATUS_MAP[order.status]}
                            className="w-full bg-[#1A1A1A] hover:bg-[#333] text-white font-bold"
                        >
                            {updating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                                    Updating...
                                </>
                            ) : (
                                "Save Status"
                            )}
                        </Button>
                    </div>
                </div>

                {/* Print Actions Card */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-black text-[#1A1A1A] mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#C8102E]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                        </svg>
                        Print Documents
                    </h3>
                    <div className="space-y-3">
                        <Button
                            onClick={handleDownloadInvoice}
                            disabled={downloading === "invoice"}
                            variant="outline"
                            className="w-full justify-start font-bold border-gray-200 hover:border-[#1A1A1A] hover:bg-gray-50"
                        >
                            {downloading === "invoice" ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                    Print Invoice
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={handleDownloadShippingLabel}
                            disabled={downloading === "label" || !address}
                            variant="outline"
                            className="w-full justify-start font-bold border-gray-200 hover:border-[#1A1A1A] hover:bg-gray-50"
                        >
                            {downloading === "label" ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                    </svg>
                                    Print Shipping Label
                                </>
                            )}
                        </Button>
                        {!address && (
                            <p className="text-xs text-amber-600 font-medium">
                                ⚠️ No shipping address available for this order
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Shipping Address (if available) */}
            {address && (
                <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm">
                    <h3 className="text-lg font-black text-[#1A1A1A] mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#C8102E]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        Shipping Address
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <p className="font-bold text-[#1A1A1A]">{address.firstName} {address.lastName}</p>
                        <p className="text-sm text-gray-600">{address.fullAddress}</p>
                        <p className="text-sm text-gray-600">{address.neighborhood}, {address.district}</p>
                        <p className="text-sm text-gray-600">{address.city}</p>
                        <p className="text-sm text-gray-600 font-medium">Phone: {address.phone}</p>
                    </div>
                </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-3xl border border-[#A9A9A9] shadow-sm overflow-hidden">
                <div className="px-6 md:px-8 py-6 bg-[#FAFAFA] border-b border-[#A9A9A9]/20">
                    <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight">Purchased Items</h2>
                </div>

                {/* Mobile List View */}
                <div className="md:hidden divide-y divide-[#A9A9A9]/10">
                    {(order.items || []).map((item) => (
                        <div key={item.id} className="p-6 space-y-3">
                            <div>
                                <h3 className="font-bold text-[#1A1A1A] text-lg leading-tight">{item.product.title}</h3>
                                {item.product.description && (
                                    <p className="text-xs text-[#A9A9A9] mt-1 line-clamp-1">{item.product.description}</p>
                                )}
                                <p className="text-[10px] text-gray-300 font-mono mt-1">Prod ID: {item.product.id}</p>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Quantity</span>
                                <span className="font-bold text-[#1A1A1A]">x{item.quantity}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Unit Price</span>
                                <span className="font-bold text-[#1A1A1A]">${(item.price / 100).toFixed(2)}</span>
                            </div>

                            <div className="pt-2 flex justify-between items-center border-t border-gray-50 mt-2">
                                <span className="font-bold text-[#1A1A1A]">Subtotal</span>
                                <span className="font-black text-[#C8102E] text-lg">${((item.price * item.quantity) / 100).toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                    <div className="p-6 bg-[#FAFAFA]/50 border-t border-[#A9A9A9]/20">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-black text-[#1A1A1A]">Grand Total</span>
                            <span className="text-3xl font-black text-[#C8102E]">${(order.total / 100).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#A9A9A9]/10">
                                <th className="px-8 py-4 text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest">Product</th>
                                <th className="px-8 py-4 text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest text-center">Qty</th>
                                <th className="px-8 py-4 text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest text-right">Unit Price</th>
                                <th className="px-8 py-4 text-[10px] font-black text-[#A9A9A9] uppercase tracking-widest text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#A9A9A9]/10">
                            {(order.items || []).map((item) => (
                                <tr key={item.id} className="hover:bg-red-50/10 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-[#1A1A1A] text-lg">{item.product.title}</div>
                                        {item.product.description && (
                                            <p className="text-sm text-[#A9A9A9] mt-1 font-medium line-clamp-1">{item.product.description}</p>
                                        )}
                                        <div className="text-[10px] text-gray-300 font-mono mt-1">ID: {item.product.id}</div>
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
                                    Total Revenue
                                </td>
                                <td className="px-8 py-8 text-right text-3xl text-[#C8102E]">
                                    ${(order.total / 100).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
