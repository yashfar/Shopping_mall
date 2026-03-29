"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, Check, X } from "lucide-react";

type ReturnRequest = {
    id: string;
    reason: string;
    note: string | null;
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

const reasonLabels: Record<string, string> = {
    DAMAGED: "Damaged product",
    WRONG_ITEM: "Wrong item received",
    NOT_AS_DESCRIBED: "Not as described",
    CHANGED_MIND: "Changed mind",
    OTHER: "Other",
};

export default function ReturnsPage() {
    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/returns");
            const data = await res.json();
            setReturns(data.returns || []);
        } catch {
            toast.error("Failed to load return requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, []);

    const handleAction = async (id: string, action: "approve" | "reject") => {
        setProcessingId(id);
        try {
            const res = await fetch(`/api/admin/returns/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, adminNote: adminNotes[id] || "" }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || `Failed to ${action} return`);
                return;
            }
            toast.success(action === "approve"
                ? `Return approved${data.refunded ? " — Stripe refund issued" : " — manual refund may be needed"}`
                : "Return rejected"
            );
            await fetchReturns();
        } catch {
            toast.error(`Failed to ${action} return`);
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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Return Requests</h1>
                    <p className="text-gray-500 mt-2">Review and process customer return requests.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={fetchReturns} variant="outline" size="icon" title="Refresh">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Link href="/admin" className="flex items-center text-sm font-medium text-gray-500 hover:text-[#C8102E] transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
                        Back to Admin
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center min-h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8102E]" />
                </div>
            ) : returns.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-lg font-medium text-gray-500">No return requests yet</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Pending Returns */}
                    {pending.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
                                Pending Requests
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
                                                    Requested {new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                                </p>
                                            </div>
                                            <span className="text-lg font-black text-gray-900">${(r.order.total / 100).toFixed(2)}</span>
                                        </div>

                                        {/* Reason */}
                                        <div className="bg-orange-50 rounded-lg p-3 mb-4 border border-orange-100">
                                            <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Reason</p>
                                            <p className="text-sm text-gray-700 font-medium">{reasonLabels[r.reason] || r.reason}</p>
                                            {r.note && <p className="text-xs text-gray-500 mt-1">{r.note}</p>}
                                        </div>

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
                                            placeholder="Admin note (optional)"
                                            rows={2}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 mb-3"
                                        />

                                        {/* Actions */}
                                        <div className="flex gap-3">
                                            <Button
                                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold gap-2"
                                                onClick={() => handleAction(r.id, "approve")}
                                                disabled={processingId === r.id}
                                            >
                                                <Check className="w-4 h-4" />
                                                {processingId === r.id ? "Processing..." : "Approve & Refund"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-bold gap-2"
                                                onClick={() => handleAction(r.id, "reject")}
                                                disabled={processingId === r.id}
                                            >
                                                <X className="w-4 h-4" />
                                                Reject
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
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Processed</h2>
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
                                            {r.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
