"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@@/components/ui/button";
import { useCurrency } from "@@/context/CurrencyContext";
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

type ReturnRequest = {
    id: string;
    reason: string;
    note: string | null;
    photos: string[];
    status: string;
    adminNote: string | null;
    createdAt: string;
};

type Order = {
    id: string;
    orderNumber?: string | null;
    total: number;
    status: string;
    createdAt: string;
    user?: User | null;
    items?: OrderItem[];
    returnRequest?: ReturnRequest | null;
    trackingNumber?: string | null;
    shippingCompany?: string | null;
    trackingUrl?: string | null;
    paymentProofUrl?: string | null;
};

const STATUS_MAP: Record<string, string> = {
    pending: "PENDING",
    payment_uploaded: "PAYMENT_UPLOADED",
    payment_rejected: "PAYMENT_REJECTED",
    ready_to_ship: "PAID",
    shipped: "SHIPPED",
    delivered: "COMPLETED",
    cancelled: "CANCELED",
};

const REVERSE_STATUS_MAP: Record<string, string> = {
    PENDING: "pending",
    PAYMENT_UPLOADED: "payment_uploaded",
    PAYMENT_REJECTED: "payment_rejected",
    PAID: "ready_to_ship",
    SHIPPED: "shipped",
    COMPLETED: "delivered",
    CANCELED: "cancelled",
};

export default function AdminOrderDetails({ orderId }: { orderId: string }) {
    const t = useTranslations("adminOrderDetails");
    const { formatPrice } = useCurrency();
    const [order, setOrder] = useState<Order | null>(null);
    const [address, setAddress] = useState<Address>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("");
    const [updating, setUpdating] = useState(false);
    const [downloading, setDownloading] = useState<"invoice" | "label" | null>(null);
    const [processingReturn, setProcessingReturn] = useState(false);
    const [returnAdminNote, setReturnAdminNote] = useState("");
    const [returnConfirm, setReturnConfirm] = useState<"approve" | "reject" | null>(null);
    const [trackingNumber, setTrackingNumber] = useState("");
    const [shippingCompany, setShippingCompany] = useState("");
    const [trackingUrl, setTrackingUrl] = useState("");
    const [verifyingPayment, setVerifyingPayment] = useState(false);
    const [paymentConfirm, setPaymentConfirm] = useState<"approve" | "reject" | null>(null);

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
            setTrackingNumber(data.order.trackingNumber || "");
            setShippingCompany(data.order.shippingCompany || "");
            setTrackingUrl(data.order.trackingUrl || "");
        } catch (err: any) {
            setError(err.message || "Failed to load order");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!selectedStatus || !order) return;

        if (selectedStatus === "shipped" && !trackingNumber.trim()) {
            toast.error("Kargoya verilen siparişler için takip numarası zorunludur.");
            return;
        }

        setUpdating(true);
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: STATUS_MAP[selectedStatus], trackingNumber, shippingCompany, trackingUrl }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update status");
            }

            const data = await response.json();
            setOrder(data.order);
            toast.success(t("orderStatusUpdated"));
        } catch (err: any) {
            toast.error(err.message || t("failedToUpdateStatus"));
        } finally {
            setUpdating(false);
        }
    };

    const handleVerifyPayment = async (action: "approve" | "reject") => {
        setPaymentConfirm(null);
        setVerifyingPayment(true);
        try {
            const response = await fetch(`/api/admin/orders/${orderId}/verify-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || (action === "approve" ? t("failedToApprovePayment") : t("failedToRejectPayment")));
            }

            toast.success(action === "approve" ? t("paymentApproved") : t("paymentRejectedMsg"));
            await fetchOrder();
        } catch (err: any) {
            toast.error(err.message || (action === "approve" ? t("failedToApprovePayment") : t("failedToRejectPayment")));
        } finally {
            setVerifyingPayment(false);
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
            toast.success(t("invoiceDownloaded"));
        } catch (err: any) {
            toast.error(err.message || t("failedToDownloadInvoice"));
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
                throw new Error(data.error || t("failedToGenerateShippingLabel"));
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
            toast.success(t("shippingLabelDownloaded"));
        } catch (err: any) {
            toast.error(err.message || t("failedToDownloadShippingLabel"));
        } finally {
            setDownloading(null);
        }
    };

    const handleReturnAction = async (action: "approve" | "reject") => {
        if (!order?.returnRequest) return;
        setReturnConfirm(null);
        setProcessingReturn(true);
        try {
            const res = await fetch(`/api/admin/returns/${order.returnRequest.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, adminNote: returnAdminNote }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || (action === "approve" ? t("failedToApproveReturn") : t("failedToRejectReturn")));
                return;
            }
            toast.success(action === "approve" ? t("returnApproved") : t("returnRejected"));
            await fetchOrder();
        } catch {
            toast.error(action === "approve" ? t("failedToApproveReturn") : t("failedToRejectReturn"));
        } finally {
            setProcessingReturn(false);
        }
    };

    const reasonLabels: Record<string, string> = {
        DAMAGED: t("damagedProduct"),
        WRONG_ITEM: t("wrongItem"),
        NOT_AS_DESCRIBED: t("notAsDescribed"),
        CHANGED_MIND: t("changedMind"),
        OTHER: t("other"),
    };

    const getStatusStyles = (status: string) => {
        const base = "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border";
        switch (status) {
            case "PENDING":
                return `${base} bg-amber-50 text-amber-600 border-amber-100`;
            case "PAYMENT_UPLOADED":
                return `${base} bg-blue-50 text-blue-600 border-blue-100`;
            case "PAYMENT_REJECTED":
                return `${base} bg-red-50 text-red-600 border-red-100`;
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
                <p className="text-gray-400 font-medium animate-pulse">{t("loadingDetails")}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center max-w-lg mx-auto shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#C8102E] mx-auto mb-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <h3 className="text-lg font-bold text-[#C8102E] mb-2">{t("errorLoading")}</h3>
                <p className="text-red-600/80">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="mt-6 border-red-200 text-red-700 hover:bg-red-100">
                    {t("tryAgain")}
                </Button>
            </div>
        );
    }

    if (!order) {
        return <div className="text-center py-20 text-gray-400 font-bold">{t("orderNotFound")}</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20 animate-in fade-in duration-500 delay-150">
            {/* Left Column - Main Content (2/3 width) */}
            <div className="lg:col-span-2 space-y-8">
                {/* Payment Proof Review Card - shown when proof is uploaded */}
                {order.status === "PAYMENT_UPLOADED" && order.paymentProofUrl && (
                    <div className="bg-white rounded-3xl border-2 border-blue-200 shadow-xl shadow-blue-100/50 overflow-hidden">
                        <div className="px-6 py-5 border-b border-blue-100 bg-blue-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-black text-blue-700 tracking-tight flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                                </svg>
                                {t("paymentProofAwaiting")}
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-center min-h-[200px]">
                                {order.paymentProofUrl.endsWith(".pdf") ? (
                                    <a
                                        href={order.paymentProofUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                        </svg>
                                        {t("viewPdfReceipt")}
                                    </a>
                                ) : (
                                    <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={order.paymentProofUrl}
                                            alt="Payment proof"
                                            className="max-w-full max-h-[400px] rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                        />
                                    </a>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setPaymentConfirm("approve")}
                                    disabled={verifyingPayment}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl py-6"
                                >
                                    {verifyingPayment ? t("processing") : t("approvePayment")}
                                </Button>
                                <Button
                                    onClick={() => setPaymentConfirm("reject")}
                                    disabled={verifyingPayment}
                                    variant="outline"
                                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl py-6"
                                >
                                    {t("reject")}
                                </Button>
                            </div>

                            {/* Payment Confirmation Modal */}
                            {paymentConfirm && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPaymentConfirm(null)} />
                                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${paymentConfirm === "approve" ? "bg-emerald-50" : "bg-red-50"}`}>
                                            {paymentConfirm === "approve"
                                                ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-emerald-600"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>
                                                : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-600"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>
                                            }
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
                                            {paymentConfirm === "approve" ? t("confirmPaymentApproveTitle") : t("confirmPaymentRejectTitle")}
                                        </h3>
                                        <p className="text-sm text-gray-500 text-center mb-6">
                                            {paymentConfirm === "approve" ? t("confirmPaymentApproveDesc") : t("confirmPaymentRejectDesc")}
                                            {" "}<span className="font-semibold text-gray-700">#{order.orderNumber || order.id.substring(0, 8)}</span>
                                        </p>
                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => setPaymentConfirm(null)}
                                                disabled={verifyingPayment}
                                            >
                                                {t("cancelAction")}
                                            </Button>
                                            <Button
                                                className={`flex-1 text-white font-bold ${paymentConfirm === "approve" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-[#C8102E] hover:bg-[#A90D27]"}`}
                                                onClick={() => handleVerifyPayment(paymentConfirm)}
                                                disabled={verifyingPayment}
                                            >
                                                {verifyingPayment
                                                    ? t("processing")
                                                    : paymentConfirm === "approve" ? t("confirmPaymentApproveBtn") : t("confirmPaymentRejectBtn")
                                                }
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Payment proof thumbnail for other statuses */}
                {order.paymentProofUrl && order.status !== "PAYMENT_UPLOADED" && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                            <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest">{t("paymentProof")}</h2>
                        </div>
                        <div className="p-4 flex items-center justify-center">
                            {order.paymentProofUrl.endsWith(".pdf") ? (
                                <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                                    {t("viewPdfReceipt")}
                                </a>
                            ) : (
                                <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                                    <img src={order.paymentProofUrl} alt="Payment proof" className="max-w-[200px] max-h-[150px] rounded-lg object-contain" />
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Order Summary Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                        <h2 className="text-lg font-black text-[#1A1A1A] tracking-tight flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            {t("orderItems")}
                        </h2>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{order.items?.length || 0} ITEMS</span>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {(order.items || []).map((item) => (
                            <div key={item.id} className="p-6 transition-colors hover:bg-gray-50/50">
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="w-full sm:w-24 h-24 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                                        {item.product.thumbnail ? (
                                            <img src={item.product.thumbnail} alt={item.product.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                            </svg>
                                        )}
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-[#1A1A1A] text-base sm:text-lg">{item.product.title}</h3>
                                                <p className="font-black text-[#1A1A1A] text-lg sm:text-xl">{formatPrice(item.price * item.quantity)}</p>
                                            </div>
                                            {item.product.description && (
                                                <p className="text-sm text-gray-500 line-clamp-2 max-w-xl">{item.product.description}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100/50">
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                                                <span className="text-[10px] uppercase font-black text-[#A9A9A9] tracking-widest">{t("qty")}</span>
                                                <span className="font-bold text-[#1A1A1A]">{item.quantity}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                                                <span className="text-[10px] uppercase font-black text-[#A9A9A9] tracking-widest">{t("unitPrice")}</span>
                                                <span className="font-medium text-gray-600">{formatPrice(item.price)}</span>
                                            </div>
                                            <div className="ml-auto text-[10px] text-gray-400 font-mono">ID: {item.product.id.substring(0, 8)}...</div>
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
                                <span className="font-black text-[#1A1A1A]">{t("total")}</span>
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
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 text-gray-900/5 rotate-12">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>

                    <h3 className="text-sm font-black text-[#A9A9A9] uppercase tracking-widest mb-4">{t("orderStatus")}</h3>

                    <div className="mb-6">
                        <span className={getStatusStyles(order.status)}>
                            {order.status}
                        </span>
                        <p className="text-xs text-gray-400 mt-2 font-medium">
                            {t("updatedOn", { date: new Date(order.createdAt).toLocaleDateString() })}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-900 block">{t("changeStatus")}</label>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-full bg-white border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-[#C8102E]/20">
                                <SelectValue placeholder={t("selectStatus")} />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="pending">{t("statusPendingPayment")}</SelectItem>
                                <SelectItem value="payment_uploaded">{t("statusPaymentUploaded")}</SelectItem>
                                <SelectItem value="payment_rejected">{t("statusPaymentRejected")}</SelectItem>
                                <SelectItem value="ready_to_ship">{t("statusReadyToShip")}</SelectItem>
                                <SelectItem value="shipped">{t("statusShipped")}</SelectItem>
                                <SelectItem value="delivered">{t("statusDelivered")}</SelectItem>
                                <SelectItem value="cancelled">{t("statusCancelled")}</SelectItem>
                            </SelectContent>
                        </Select>

                        <div>
                            <label className="text-xs font-bold text-gray-900 block mb-2">
                                {t("trackingNumber")}
                                {selectedStatus === "shipped" && (
                                    <span className="text-red-500 ml-1">*</span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder={t("trackingPlaceholder")}
                                className={`w-full h-10 px-3 rounded-xl border bg-white text-sm font-mono focus:outline-none focus:ring-2 transition-all ${
                                    selectedStatus === "shipped" && !trackingNumber.trim()
                                        ? "border-red-400 ring-red-200 focus:ring-red-200 focus:border-red-500"
                                        : "border-gray-200 focus:ring-[#C8102E]/20 focus:border-[#C8102E]"
                                }`}
                            />
                            {selectedStatus === "shipped" && !trackingNumber.trim() && (
                                <p className="text-xs text-red-500 mt-1 font-medium">
                                    Kargo durumu için takip numarası girilmesi zorunludur.
                                </p>
                            )}
                            {selectedStatus === "shipped" && trackingNumber.trim() && (
                                <p className="text-xs text-emerald-600 mt-1 font-medium">
                                    Kaydedilince müşteriye otomatik bildirim e-postası gönderilecek.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-900 block mb-2">
                                {t("shippingCompany")}
                            </label>
                            <input
                                type="text"
                                value={shippingCompany}
                                onChange={(e) => setShippingCompany(e.target.value)}
                                placeholder={t("shippingCompanyPlaceholder")}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-900 block mb-2">
                                {t("trackingUrl")}
                            </label>
                            <input
                                type="url"
                                value={trackingUrl}
                                onChange={(e) => setTrackingUrl(e.target.value)}
                                placeholder={t("trackingUrlPlaceholder")}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                            />
                        </div>

                        <Button
                            onClick={handleStatusUpdate}
                            disabled={updating || (selectedStatus === REVERSE_STATUS_MAP[order.status] && trackingNumber === (order.trackingNumber || "") && shippingCompany === (order.shippingCompany || "") && trackingUrl === (order.trackingUrl || ""))}
                            className="w-full bg-[#1A1A1A] hover:bg-[#333] text-white font-bold rounded-xl py-6 transition-all active:scale-95"
                        >
                            {updating ? t("updating") : t("updateStatus")}
                        </Button>
                    </div>

                    {/* Return Request Section */}
                    {order.returnRequest && order.returnRequest.status === "PENDING" && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 mb-3">
                                <p className="text-xs font-black text-orange-600 uppercase tracking-wider mb-2">{t("returnRequest")}</p>
                                <p className="text-sm font-medium text-gray-800">{reasonLabels[order.returnRequest.reason] || order.returnRequest.reason}</p>
                                {order.returnRequest.note && (
                                    <p className="text-xs text-gray-500 mt-1">{order.returnRequest.note}</p>
                                )}
                                {order.returnRequest.photos && order.returnRequest.photos.length > 0 && (
                                    <div className="mt-2 flex gap-2 flex-wrap">
                                        {order.returnRequest.photos.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-14 h-14 rounded-lg overflow-hidden border border-orange-200 hover:opacity-80 transition-opacity">
                                                <img src={url} alt={`Fotoğraf ${i + 1}`} className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                                <p className="text-[10px] text-gray-400 mt-2">
                                    {new Date(order.returnRequest.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                </p>
                            </div>
                            <textarea
                                value={returnAdminNote}
                                onChange={(e) => setReturnAdminNote(e.target.value)}
                                placeholder={t("adminNotePlaceholder")}
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 mb-3"
                            />
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm"
                                    onClick={() => setReturnConfirm("approve")}
                                    disabled={processingReturn}
                                >
                                    {processingReturn ? t("processing") : t("approve")}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-bold text-sm"
                                    onClick={() => setReturnConfirm("reject")}
                                    disabled={processingReturn}
                                >
                                    {t("reject")}
                                </Button>
                            </div>
                        </div>
                    )}

                    {order.returnRequest && order.returnRequest.status !== "PENDING" && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <div className={`rounded-xl p-3 border ${
                                order.returnRequest.status === "APPROVED"
                                    ? "bg-emerald-50 border-emerald-100"
                                    : "bg-red-50 border-red-100"
                            }`}>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                                    order.returnRequest.status === "APPROVED" ? "text-emerald-600" : "text-red-600"
                                }`}>
                                    {order.returnRequest.status === "APPROVED" ? t("returnApprovedLabel") : t("returnRejectedLabel")}
                                </p>
                                {order.returnRequest.adminNote && (
                                    <p className="text-xs text-gray-500">{order.returnRequest.adminNote}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Return Confirmation Modal */}
                {returnConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReturnConfirm(null)} />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${returnConfirm === "approve" ? "bg-emerald-50" : "bg-red-50"}`}>
                                {returnConfirm === "approve"
                                    ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-emerald-600"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>
                                    : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-600"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>
                                }
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
                                {returnConfirm === "approve" ? t("confirmApproveTitle") : t("confirmRejectTitle")}
                            </h3>
                            <p className="text-sm text-gray-500 text-center mb-6">
                                {returnConfirm === "approve" ? t("confirmApproveDesc") : t("confirmRejectDesc")}
                                {" "}<span className="font-semibold text-gray-700">#{order?.orderNumber || ""}</span>
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setReturnConfirm(null)}
                                    disabled={processingReturn}
                                >
                                    {t("cancelAction")}
                                </Button>
                                <Button
                                    className={`flex-1 text-white font-bold ${returnConfirm === "approve" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-[#C8102E] hover:bg-[#A90D27]"}`}
                                    onClick={() => handleReturnAction(returnConfirm)}
                                    disabled={processingReturn}
                                >
                                    {processingReturn
                                        ? t("processing")
                                        : returnConfirm === "approve" ? t("confirmApproveBtn") : t("confirmRejectBtn")
                                    }
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Customer Details */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-6">
                    <h3 className="text-sm font-black text-[#A9A9A9] uppercase tracking-widest mb-6">{t("customerDetails")}</h3>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg border-2 border-white shadow-sm">
                            {order.user?.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold text-[#1A1A1A] truncate">{order.user?.firstName || t("guest")} {order.user?.lastName || t("user")}</p>
                            <p className="text-xs text-gray-500 truncate">{order.user?.email}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{t("contactInfo")}</span>
                            <div className="bg-gray-50 rounded-xl p-3 text-sm text-[#1A1A1A] font-medium border border-gray-100">
                                {order.user?.phone || t("noPhone")}
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{t("orderNumber")}</span>
                            <div className="bg-gray-50 rounded-xl p-3 text-sm text-[#1A1A1A] font-mono font-bold border border-gray-100 flex items-center justify-between group cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => {
                                    navigator.clipboard.writeText(order.orderNumber || order.id);
                                    toast.success(t("orderIdCopied"));
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
                    <h3 className="text-sm font-black text-[#A9A9A9] uppercase tracking-widest mb-4">{t("shippingAddress")}</h3>

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
                                        <p className="text-sm text-gray-600 leading-relaxed">{address.fullAddress}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 flex-shrink-0"></div>
                                    <div>
                                        <p className="text-sm text-gray-600">{address.city}, {address.district}</p>
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
                                <p className="text-sm font-bold text-amber-800">{t("noAddress")}</p>
                                <p className="text-xs text-amber-600 mt-1">{t("noAddressDesc")}</p>
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
                        {t("downloadInvoice")}
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
                        {t("shippingLabel")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
