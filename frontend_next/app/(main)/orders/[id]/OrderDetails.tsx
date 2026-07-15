"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCurrency } from "@@/context/CurrencyContext";
import { Button } from "@@/components/ui/button";
import { toast } from "sonner";

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
    trackingNumber?: string | null;
    shippingCompany?: string | null;
    trackingUrl?: string | null;
};

export default function OrderDetails({ orderId }: { orderId: string }) {
    const t = useTranslations("orderDetails");
    const { formatPrice } = useCurrency();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [canceling, setCanceling] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showReturn, setShowReturn] = useState(false);
    const [returnReason, setReturnReason] = useState("");
    const [returnNote, setReturnNote] = useState("");
    const [returnPhotos, setReturnPhotos] = useState<string[]>([]);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [submittingReturn, setSubmittingReturn] = useState(false);

    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        if (returnPhotos.length + files.length > 3) {
            toast.error(t("photoMaxError"));
            return;
        }
        setUploadingPhoto(true);
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch("/api/upload/return-photo", {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();
                if (!res.ok) {
                    toast.error(data.error || t("photoUploadFailed"));
                    continue;
                }
                setReturnPhotos((prev) => [...prev, data.url]);
            }
        } catch {
            toast.error(t("photoUploadFailed"));
        } finally {
            setUploadingPhoto(false);
            e.target.value = "";
        }
    };

    const submitReturn = async () => {
        if (!returnReason) {
            toast.error(t("selectReasonError"));
            return;
        }
        if (returnPhotos.length === 0) {
            toast.error(t("photoRequired"));
            return;
        }
        setSubmittingReturn(true);
        try {
            const res = await fetch(`/api/orders/${orderId}/return`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: returnReason, note: returnNote, photos: returnPhotos }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || t("returnSubmitFailed"));
                return;
            }
            toast.success(t("returnSubmitSuccess"));
            setOrder((prev) => prev ? { ...prev, status: "RETURN_REQUESTED" } : prev);
            setShowReturn(false);
        } catch {
            toast.error(t("returnSubmitFailed"));
        } finally {
            setSubmittingReturn(false);
        }
    };

    const cancelOrder = async () => {
        setCanceling(true);
        try {
            const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || t("cancelFailed"));
                return;
            }
            toast.success(t("orderCanceled"));
            setOrder((prev) => prev ? { ...prev, status: "CANCELED" } : prev);
        } catch {
            toast.error(t("cancelFailed"));
        } finally {
            setCanceling(false);
            setShowConfirm(false);
        }
    };

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
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load order");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "PENDING":           return t("statusPending");
            case "PAYMENT_UPLOADED":  return t("statusPaymentUploaded");
            case "PAYMENT_REJECTED":  return t("statusPaymentRejected");
            case "PAID":              return t("statusPaid");
            case "SHIPPED":           return t("statusShipped");
            case "DELIVERED":         return t("statusDelivered");
            case "COMPLETED":         return t("statusCompleted");
            case "CANCELED":
            case "CANCELLED":         return t("statusCanceled");
            case "RETURN_REQUESTED":  return t("statusReturnRequested");
            case "RETURNED":          return t("statusReturned");
            default:                  return status;
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
            case "RETURN_REQUESTED":
                return `${base} bg-orange-50 text-orange-600 border-orange-100`;
            case "RETURNED":
                return `${base} bg-violet-50 text-violet-600 border-violet-100`;
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
                <p className="text-gray-400 font-medium animate-pulse">{t("loading")}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center max-w-lg mx-auto shadow-sm my-10">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#C8102E] mx-auto mb-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <h3 className="text-lg font-bold text-[#C8102E] mb-2">{t("errorLoading")}</h3>
                <p className="text-red-600/80 mb-6">{error}</p>
                <Link href="/orders">
                    <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">
                        {t("backToOrders")}
                    </Button>
                </Link>
            </div>
        );
    }

    if (!order) {
        return <div className="text-center py-20 text-gray-400 font-bold">{t("orderNotFound")}</div>;
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
                            {t("orderItems")}
                        </h2>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{order.items.length} {t("items")}</span>
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
                                                    {formatPrice(item.price * item.quantity)}
                                                </p>
                                            </div>
                                            {item.product.description && (
                                                <p className="text-sm text-gray-500 line-clamp-2 max-w-xl">{item.product.description}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100/50">
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                                                <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest">{t("qty")}</span>
                                                <span className="font-bold text-gray-900">{item.quantity}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                                                <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest">{t("unitPrice")}</span>
                                                <span className="font-medium text-gray-600">{formatPrice(item.price)}</span>
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
                                <span className="text-gray-500 font-medium">{t("subtotal")}</span>
                                <span className="font-bold text-gray-900">{formatPrice(order.total)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">{t("shipping")}</span>
                                <span className="font-bold text-gray-900 text-green-600">{t("free")}</span>
                            </div>
                            <div className="my-2 border-t border-gray-200 border-dashed"></div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-black text-gray-900">{t("totalPaid")}</span>
                                <span className="font-black text-[#C8102E] text-2xl">{formatPrice(order.total)}</span>
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

                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">{t("orderStatus")}</h3>

                    <div className="mb-6">
                        <span className={getStatusStyles(order.status)}>
                            {getStatusLabel(order.status)}
                        </span>
                        <p className="text-xs text-gray-400 mt-2 font-medium">
                            {t("placedOn", { date: new Date(order.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) })}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t("reference")}</label>
                        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-900 font-mono font-bold border border-gray-100 flex items-center justify-between group cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => {
                                navigator.clipboard.writeText(order.orderNumber || order.id);
                            }}
                            title={t("clickToCopyOrderId")}
                        >
                            {order.orderNumber || order.id.substring(0, 8)}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-gray-400 group-hover:text-gray-900">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                            </svg>
                        </div>
                    </div>

                    {order.trackingNumber && (
                        <div className="mt-4 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t("trackingNumber")}</label>
                            <div className="bg-sky-50 rounded-xl p-3 text-sm text-sky-900 font-mono font-bold border border-sky-100 flex items-center justify-between group cursor-pointer hover:bg-sky-100 transition-colors"
                                onClick={() => {
                                    navigator.clipboard.writeText(order.trackingNumber!);
                                    toast.success(t("trackingCopied"));
                                }}
                                title={t("clickToCopy")}
                            >
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-sky-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                    </svg>
                                    <span>{order.trackingNumber}</span>
                                    {order.shippingCompany && (
                                        <span className="text-xs font-semibold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full font-sans">
                                            {order.shippingCompany}
                                        </span>
                                    )}
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-sky-400 group-hover:text-sky-700 shrink-0">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                </svg>
                            </div>
                            {order.trackingUrl && (
                                <a
                                    href={order.trackingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                    </svg>
                                    {t("trackOnCarrierSite")}
                                </a>
                            )}
                        </div>
                    )}

                    {order.status === "PENDING" && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                            {!showConfirm ? (
                                <Button
                                    variant="outline"
                                    className="w-full border-red-200 text-[#C8102E] hover:bg-red-50 hover:border-[#C8102E] font-bold"
                                    onClick={() => setShowConfirm(true)}
                                >
                                    {t("cancelOrder")}
                                </Button>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-500 text-center font-medium">{t("cancelConfirm")}</p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 text-sm"
                                            onClick={() => setShowConfirm(false)}
                                            disabled={canceling}
                                        >
                                            {t("keepOrder")}
                                        </Button>
                                        <Button
                                            className="flex-1 text-sm bg-[#C8102E] hover:bg-[#A90D27] text-white font-bold"
                                            onClick={cancelOrder}
                                            disabled={canceling}
                                        >
                                            {canceling ? t("canceling") : t("yesCancel")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {["PAID", "SHIPPED", "COMPLETED", "DELIVERED"].includes(order.status) && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                            {!showReturn ? (
                                <Button
                                    variant="outline"
                                    className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-400 font-bold"
                                    onClick={() => setShowReturn(true)}
                                >
                                    {t("requestReturn")}
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-500 font-medium">{t("returnReason")}</p>
                                    <select
                                        value={returnReason}
                                        onChange={(e) => setReturnReason(e.target.value)}
                                        className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                                    >
                                        <option value="">{t("selectReason")}</option>
                                        <option value="DAMAGED">{t("damagedProduct")}</option>
                                        <option value="WRONG_ITEM">{t("wrongItem")}</option>
                                        <option value="NOT_AS_DESCRIBED">{t("notAsDescribed")}</option>
                                        <option value="CHANGED_MIND">{t("changedMind")}</option>
                                        <option value="OTHER">{t("other")}</option>
                                    </select>
                                    <textarea
                                        value={returnNote}
                                        onChange={(e) => setReturnNote(e.target.value)}
                                        placeholder={t("additionalDetails")}
                                        rows={2}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                                    />

                                    {/* Photo Upload */}
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500 font-medium">
                                            {t("uploadPhotos")} <span className="text-[#C8102E] font-bold">*</span> <span className="text-gray-400">({t("maxPhotos")})</span>
                                        </p>
                                        {returnPhotos.length > 0 && (
                                            <div className="flex gap-2 flex-wrap">
                                                {returnPhotos.map((url, i) => (
                                                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                            onClick={() => setReturnPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                                                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                                {uploadingPhoto && (
                                                    <div className="w-16 h-16 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
                                                        <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {returnPhotos.length < 3 && (
                                            <label className={`flex items-center gap-2 text-xs font-medium text-orange-600 cursor-pointer hover:text-orange-700 transition-colors ${uploadingPhoto ? "opacity-50 pointer-events-none" : ""}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                                </svg>
                                                {uploadingPhoto ? t("uploading") : t("addPhoto")}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handlePhotoSelect}
                                                    disabled={uploadingPhoto}
                                                />
                                            </label>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 text-sm"
                                            onClick={() => { setShowReturn(false); setReturnReason(""); setReturnNote(""); setReturnPhotos([]); }}
                                            disabled={submittingReturn}
                                        >
                                            {t("cancel")}
                                        </Button>
                                        <Button
                                            className="flex-1 text-sm bg-orange-500 hover:bg-orange-600 text-white font-bold"
                                            onClick={submitReturn}
                                            disabled={submittingReturn || !returnReason || uploadingPhoto || returnPhotos.length === 0}
                                        >
                                            {submittingReturn ? t("submitting") : t("submitRequest")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {order.status === "RETURN_REQUESTED" && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">{t("returnPending")}</p>
                                <p className="text-xs text-orange-500">{t("returnPendingMessage")}</p>
                            </div>
                        </div>
                    )}

                    {order.status === "RETURNED" && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
                                <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1">{t("returnApproved")}</p>
                                <p className="text-xs text-violet-500">{t("returnApprovedMessage")}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Need Help Card */}
                <div className="bg-[#1A1A1A] rounded-3xl p-6 text-white shadow-xl shadow-[#1A1A1A]/20">
                    <h3 className="text-sm font-bold text-white mb-2">{t("needHelp")}</h3>
                    <p className="text-xs text-gray-400 mb-6">{t("needHelpMessage")}</p>
                    <Link href="/contact" className="block">
                        <Button variant="outline" className="w-full bg-white/10 border-white/10 text-white hover:bg-white hover:text-black hover:border-white transition-all">
                            {t("contactSupport")}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
