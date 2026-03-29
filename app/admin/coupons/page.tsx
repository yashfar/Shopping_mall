"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@@/components/ui/button";
import { toast } from "sonner";

interface Coupon {
    id: string;
    code: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    value: number;
    minAmount: number | null;
    maxUses: number | null;
    usedCount: number;
    expiresAt: string | null;
    isActive: boolean;
    createdAt: string;
    _count: { usages: number };
}

const emptyForm = {
    code: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    value: "",
    minAmount: "",
    maxUses: "",
    expiresAt: "",
};

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const fetchCoupons = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/coupons");
            if (!res.ok) throw new Error();
            setCoupons(await res.json());
        } catch {
            toast.error("Failed to load coupons");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/admin/coupons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: form.code,
                    type: form.type,
                    value: form.type === "PERCENTAGE" ? Number(form.value) : Math.round(parseFloat(form.value) * 100),
                    minAmount: form.minAmount ? Math.round(parseFloat(form.minAmount) * 100) : null,
                    maxUses: form.maxUses ? Number(form.maxUses) : null,
                    expiresAt: form.expiresAt || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setCoupons((prev) => [data, ...prev]);
            setForm(emptyForm);
            setShowForm(false);
            toast.success(`Coupon "${data.code}" created`);
        } catch (err: any) {
            toast.error(err.message || "Failed to create coupon");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleToggle(coupon: Coupon) {
        setTogglingId(coupon.id);
        try {
            const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !coupon.isActive }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? data : c)));
            toast.success(`Coupon ${data.isActive ? "activated" : "deactivated"}`);
        } catch (err: any) {
            toast.error(err.message || "Failed to update coupon");
        } finally {
            setTogglingId(null);
        }
    }

    async function handleDelete(coupon: Coupon) {
        setDeletingId(coupon.id);
        try {
            const res = await fetch(`/api/admin/coupons/${coupon.id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
            toast.success(`Coupon "${coupon.code}" deleted`);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete coupon");
        } finally {
            setDeletingId(null);
        }
    }

    function formatValue(coupon: Coupon) {
        return coupon.type === "PERCENTAGE"
            ? `${coupon.value}% off`
            : `$${(coupon.value / 100).toFixed(2)} off`;
    }

    function isExpired(coupon: Coupon) {
        return coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100">
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A]">Coupons</h1>
                        <p className="text-sm text-[#A9A9A9] mt-0.5">Create and manage discount codes</p>
                    </div>
                </div>
                <Button
                    onClick={() => setShowForm((v) => !v)}
                    className="bg-[#C8102E] hover:bg-[#A90D27] text-white"
                >
                    <Plus className="h-4 w-4 mr-1" /> New Coupon
                </Button>
            </div>

            {/* Create form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6 space-y-4">
                    <h2 className="text-base font-bold text-[#1A1A1A]">New Coupon</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Code <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                placeholder="e.g. SUMMER20"
                                required
                                maxLength={50}
                                className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Type <span className="text-red-500">*</span></label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value as "PERCENTAGE" | "FIXED_AMOUNT" })}
                                className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] bg-white"
                            >
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Value <span className="text-red-500">*</span>
                                <span className="text-gray-400 font-normal ml-1">
                                    {form.type === "PERCENTAGE" ? "(1–100)" : "(in $)"}
                                </span>
                            </label>
                            <input
                                type="number"
                                value={form.value}
                                onChange={(e) => setForm({ ...form, value: e.target.value })}
                                placeholder={form.type === "PERCENTAGE" ? "20" : "10.00"}
                                required
                                min="1"
                                max={form.type === "PERCENTAGE" ? "100" : undefined}
                                step={form.type === "FIXED_AMOUNT" ? "0.01" : "1"}
                                className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Min. Order Amount
                                <span className="text-gray-400 font-normal ml-1">(optional, in $)</span>
                            </label>
                            <input
                                type="number"
                                value={form.minAmount}
                                onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                                placeholder="50.00"
                                min="0"
                                step="0.01"
                                className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Max Uses
                                <span className="text-gray-400 font-normal ml-1">(optional, blank = unlimited)</span>
                            </label>
                            <input
                                type="number"
                                value={form.maxUses}
                                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                                placeholder="100"
                                min="1"
                                className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Expires At
                                <span className="text-gray-400 font-normal ml-1">(optional)</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={form.expiresAt}
                                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                                className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button type="submit" disabled={submitting} className="bg-[#C8102E] hover:bg-[#A90D27] text-white">
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Coupon"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm(emptyForm); }}>
                            Cancel
                        </Button>
                    </div>
                </form>
            )}

            {/* Coupon list */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-[#C8102E]" />
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Tag className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm font-medium">No coupons yet</p>
                        <p className="text-xs mt-1">Create your first discount code above</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-xs text-[#A9A9A9] font-semibold uppercase tracking-wider">
                                <th className="text-left px-4 py-3">Code</th>
                                <th className="text-left px-4 py-3">Discount</th>
                                <th className="text-left px-4 py-3 hidden sm:table-cell">Uses</th>
                                <th className="text-left px-4 py-3 hidden md:table-cell">Expires</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {coupons.map((coupon) => (
                                <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-mono font-bold text-[#1A1A1A]">{coupon.code}</td>
                                    <td className="px-4 py-3 font-semibold text-[#C8102E]">{formatValue(coupon)}</td>
                                    <td className="px-4 py-3 hidden sm:table-cell text-gray-500">
                                        {coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ""}
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                                        {coupon.expiresAt
                                            ? <span className={isExpired(coupon) ? "text-red-500" : ""}>{new Date(coupon.expiresAt).toLocaleDateString()}</span>
                                            : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            isExpired(coupon) ? "bg-gray-100 text-gray-400" :
                                            coupon.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                        }`}>
                                            {isExpired(coupon) ? "Expired" : coupon.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 justify-end">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleToggle(coupon)}
                                                disabled={togglingId === coupon.id || isExpired(coupon)}
                                                title={coupon.isActive ? "Deactivate" : "Activate"}
                                                className="h-8 w-8 text-gray-400 hover:text-[#1A1A1A] disabled:opacity-30"
                                            >
                                                {togglingId === coupon.id
                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : coupon.isActive
                                                        ? <ToggleRight className="h-4 w-4 text-green-600" />
                                                        : <ToggleLeft className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleDelete(coupon)}
                                                disabled={deletingId === coupon.id}
                                                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                            >
                                                {deletingId === coupon.id
                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
