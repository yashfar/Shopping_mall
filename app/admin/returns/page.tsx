"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@@/components/ui/button";
import { toast } from "sonner";
import { useCurrency } from "@@/context/CurrencyContext";
import { ArrowLeft, RefreshCw, Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

type ReturnRequest = {
    id: string;
    reason: string;
    note: string | null;
    photos: string[];
    status: string;
    adminNote: string | null;
    createdAt: string;
    order: {
        id: string;
        orderNumber: string | null;
        total: number;
        user: {
            firstName: string | null;
            lastName: string | null;
            email: string;
        };
        items: {
            quantity: number;
            price: number;
            product: {
                title: string;
                thumbnail: string | null;
            };
        }[];
    };
};

type PendingConfirm = {
    id: string;
    action: "approve" | "reject";
    orderNumber: string;
};

export default function ReturnsPage() {
    const t = useTranslations("adminReturns");
    const { formatPrice } = useCurrency();
    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
    const [confirm, setConfirm] = useState<PendingConfirm | null>(null);

    const reasonLabels: Record<string, string> = {
        DAMAGED: t("reasonDamaged"),
        WRONG_ITEM: t("reasonWrongItem"),
        NOT_AS_DESCRIBED: t("reasonNotAsDescribed"),
        CHANGED_MIND: t("reasonChangedMind"),
        OTHER: t("reasonOther"),
    };

    const statusLabels: Record<string, string> = {
        APPROVED: t("statusApproved"),
        REJECTED: t("statusRejected"),
        PENDING: t("statusPending"),
    };

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/returns");
            const data = await res.json();
            setReturns(data.returns || []);
        } catch {
            toast.error(t("failedToLoad"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, []);

    const handleAction = async (id: string, action: "approve" | "reject") => {
        setConfirm(null);
        setProcessingId(id);
        try {
            const res = await fetch(`/api/admin/returns/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, adminNote: adminNotes[id] || "" }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || (action === "approve" ? t("failedToApprove") : t("failedToReject")));
                return;
            }
            toast.success(action === "approve" ? t("approveSuccess") : t("rejectSuccess"));
            await fetchReturns();
        } catch {
            toast.error(action === "approve" ? t("failedToApprove") : t("failedToReject"));
        } finally {
            setProcessingId(null);
        }
    };

    const pending = returns.filter((r) => r.status === "PENDING");
    const processed = returns.filter((r) => r.status !== "PENDING");

    return (
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t("pageTitle")}</h1>
                    <p className="text-gray-500 mt-2">{t("pageDesc")}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={fetchReturns} variant="outline" size="icon" title="Refresh">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Link href="/admin" className="flex items-center text-sm font-medium text-gray-500 hover:text-[#C8102E] transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
                        {t("backToAdmin")}
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center min-h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8102E]" />
                </div>
            ) : returns.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-lg font-medium text-gray-500">{t("noReturnsYet")}</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Pending Returns */}
                    {pending.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
                                {t("pendingRequests")}
                            </h2>
                            <div className="space-y-4">
                                {pending.map((r) => (
                                    <div key={r.id} className="bg-white rounded-xl border border-orange-200 shadow-sm p-6">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    Order #{r.order.orderNumber || r.order.id.substring(0, 8)}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {r.order.user.firstName} {r.order.user.lastName} &middot; {r.order.user.email}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {t("requested")} {new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                                </p>
                                            </div>
                                            <span className="text-lg font-black text-gray-900">{formatPrice(r.order.total)}</span>
                                        </div>

                                        {/* Reason */}
                                        <div className="bg-orange-50 rounded-lg p-3 mb-4 border border-orange-100">
                                            <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">{t("reasonLabel")}</p>
                                            <p className="text-sm text-gray-700 font-medium">{reasonLabels[r.reason] || r.reason}</p>
                                            {r.note && <p className="text-xs text-gray-500 mt-1">{r.note}</p>}
                                        </div>

                                        {/* Photos */}
                                        {r.photos && r.photos.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Müşteri Fotoğrafları</p>
                                                <div className="flex gap-2 flex-wrap">
                                                    {r.photos.map((url, i) => (
                                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity">
                                                            <img src={url} alt={`Fotoğraf ${i + 1}`} className="w-full h-full object-cover" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Items */}
                                        <div className="space-y-2 mb-4">
                                            {r.order.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-3 text-sm">
                                                    {item.product.thumbnail && (
                                                        <img src={item.product.thumbnail} alt="" className="w-8 h-8 rounded object-cover border" />
                                                    )}
                                                    <span className="text-gray-700">{item.product.title}</span>
                                                    <span className="text-gray-400">x{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Admin Note */}
                                        <textarea
                                            value={adminNotes[r.id] || ""}
                                            onChange={(e) => setAdminNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                            placeholder={t("adminNotePlaceholder")}
                                            rows={2}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 mb-3"
                                        />

                                        {/* Actions */}
                                        <div className="flex gap-3">
                                            <Button
                                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold gap-2"
                                                onClick={() => setConfirm({ id: r.id, action: "approve", orderNumber: r.order.orderNumber || r.order.id.substring(0, 8) })}
                                                disabled={processingId === r.id}
                                            >
                                                <Check className="w-4 h-4" />
                                                {processingId === r.id ? t("processing") : t("approveRefund")}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-bold gap-2"
                                                onClick={() => setConfirm({ id: r.id, action: "reject", orderNumber: r.order.orderNumber || r.order.id.substring(0, 8) })}
                                                disabled={processingId === r.id}
                                            >
                                                <X className="w-4 h-4" />
                                                {t("reject")}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Processed Returns */}
                    {processed.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4">{t("processed")}</h2>
                            <div className="space-y-3">
                                {processed.map((r) => (
                                    <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">
                                                Order #{r.order.orderNumber || r.order.id.substring(0, 8)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {r.order.user.email} &middot; {reasonLabels[r.reason] || r.reason}
                                            </p>
                                            {r.adminNote && <p className="text-xs text-gray-400 mt-1">{r.adminNote}</p>}
                                        </div>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                            r.status === "APPROVED"
                                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                : "bg-red-50 text-red-600 border border-red-100"
                                        }`}>
                                            {statusLabels[r.status] || r.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            {confirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirm(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${confirm.action === "approve" ? "bg-emerald-50" : "bg-red-50"}`}>
                            {confirm.action === "approve"
                                ? <Check className="w-6 h-6 text-emerald-600" />
                                : <X className="w-6 h-6 text-red-600" />
                            }
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
                            {confirm.action === "approve" ? t("confirmApproveTitle") : t("confirmRejectTitle")}
                        </h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            {confirm.action === "approve" ? t("confirmApproveDesc") : t("confirmRejectDesc")}
                            {" "}<span className="font-semibold text-gray-700">#{confirm.orderNumber}</span>
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setConfirm(null)}
                                disabled={processingId === confirm.id}
                            >
                                {t("cancelAction")}
                            </Button>
                            <Button
                                className={`flex-1 text-white font-bold ${confirm.action === "approve" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-[#C8102E] hover:bg-[#A90D27]"}`}
                                onClick={() => handleAction(confirm.id, confirm.action)}
                                disabled={processingId === confirm.id}
                            >
                                {processingId === confirm.id
                                    ? t("processing")
                                    : confirm.action === "approve" ? t("confirmApproveBtn") : t("confirmRejectBtn")
                                }
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
