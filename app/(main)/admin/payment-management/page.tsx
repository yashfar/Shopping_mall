
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Config = {
    taxPercent: number;
    shippingFee: number;
    freeShippingThreshold: number;
    bankName: string;
    accountHolder: string;
    iban: string;
    bankTransferNote: string;
    usdBankName: string;
    usdAccountHolder: string;
    usdIban: string;
    usdSwiftCode: string;
    usdBankTransferNote: string;
    usdShippingFee: number;
    usdFreeShippingThreshold: number;
};

export default function PaymentManagementPage() {
    const t = useTranslations("paymentManagement");
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        taxPercent: "",
        shippingFee: "",
        freeShippingThreshold: "",
        bankName: "",
        accountHolder: "",
        iban: "",
        bankTransferNote: "",
        usdBankName: "",
        usdAccountHolder: "",
        usdIban: "",
        usdSwiftCode: "",
        usdBankTransferNote: "",
        usdShippingFee: "",
        usdFreeShippingThreshold: "",
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch("/api/admin/payment-config");
            if (!res.ok) {
                if (res.status === 403) {
                    toast.error(t("unauthorized"));
                    router.push("/");
                    return;
                }
                throw new Error("Failed to fetch");
            }
            const data = await res.json();
            const config: Config = data.config;

            setFormData({
                taxPercent: config.taxPercent.toString(),
                shippingFee: (config.shippingFee / 100).toFixed(2),
                freeShippingThreshold: (config.freeShippingThreshold / 100).toFixed(2),
                bankName: config.bankName || "",
                accountHolder: config.accountHolder || "",
                iban: config.iban || "",
                bankTransferNote: config.bankTransferNote || "",
                usdBankName: config.usdBankName || "",
                usdAccountHolder: config.usdAccountHolder || "",
                usdIban: config.usdIban || "",
                usdSwiftCode: config.usdSwiftCode || "",
                usdBankTransferNote: config.usdBankTransferNote || "",
                usdShippingFee: (config.usdShippingFee / 100).toFixed(2),
                usdFreeShippingThreshold: (config.usdFreeShippingThreshold / 100).toFixed(2),
            });
        } catch (error) {
            console.error(error);
            toast.error(t("failedToLoadConfig"));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
                const taxPercent = parseFloat(formData.taxPercent) || 0;

            const payload = {
                taxPercent,
                shippingFee: Math.round((parseFloat(formData.shippingFee) || 0) * 100),
                freeShippingThreshold: Math.round((parseFloat(formData.freeShippingThreshold) || 0) * 100),
                bankName: formData.bankName.trim(),
                accountHolder: formData.accountHolder.trim(),
                iban: formData.iban.trim(),
                bankTransferNote: formData.bankTransferNote.trim(),
                usdBankName: formData.usdBankName.trim(),
                usdAccountHolder: formData.usdAccountHolder.trim(),
                usdIban: formData.usdIban.trim(),
                usdSwiftCode: formData.usdSwiftCode.trim(),
                usdBankTransferNote: formData.usdBankTransferNote.trim(),
                usdShippingFee: Math.round((parseFloat(formData.usdShippingFee) || 0) * 100),
                usdFreeShippingThreshold: Math.round((parseFloat(formData.usdFreeShippingThreshold) || 0) * 100),
            };

            const res = await fetch("/api/admin/payment-config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save");

            const data = await res.json();
            const config: Config = data.config;
            setFormData({
                taxPercent: config.taxPercent.toString(),
                shippingFee: (config.shippingFee / 100).toFixed(2),
                freeShippingThreshold: (config.freeShippingThreshold / 100).toFixed(2),
                bankName: config.bankName || "",
                accountHolder: config.accountHolder || "",
                iban: config.iban || "",
                bankTransferNote: config.bankTransferNote || "",
                usdBankName: config.usdBankName || "",
                usdAccountHolder: config.usdAccountHolder || "",
                usdIban: config.usdIban || "",
                usdSwiftCode: config.usdSwiftCode || "",
                usdBankTransferNote: config.usdBankTransferNote || "",
                usdShippingFee: (config.usdShippingFee / 100).toFixed(2),
                usdFreeShippingThreshold: (config.usdFreeShippingThreshold / 100).toFixed(2),
            });

            toast.success(t("configSaved"));
        } catch (error) {
            console.error("Save failed:", error);
            toast.error(t("failedToSave"));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-[#C8102E]/20 border-t-[#C8102E] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
            <h1 className="text-3xl font-black text-[#1A1A1A] tracking-tight">{t("title")}</h1>
            <p className="text-[#A9A9A9] text-lg">{t("subtitle")}</p>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-8">
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Tax Percent */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider block">
                            {t("taxPercentage")}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={formData.taxPercent}
                                onChange={(e) => setFormData({ ...formData, taxPercent: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-[#1A1A1A] focus:outline-none focus:border-[#C8102E] transition-colors pr-10"
                                placeholder="0"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                        </div>
                        <p className="text-xs text-gray-400">Apply a percentage tax to calculate internal reporting values. <strong>{t("taxNote")}</strong></p>
                    </div>

                    <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex gap-3 items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <span className="font-bold block mb-1">{t("taxIncludedPricing")}</span>
                            {t("taxIncludedDesc")}
                        </div>
                    </div>

                    {/* TRY Shipping Fee */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider block">
                            {t("standardShippingFee")}
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₺</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.shippingFee}
                                onChange={(e) => setFormData({ ...formData, shippingFee: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 font-bold text-[#1A1A1A] focus:outline-none focus:border-[#C8102E] transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                        <p className="text-xs text-gray-400">{t("shippingFeeNote")}</p>
                    </div>

                    {/* TRY Free Shipping Threshold */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider block">
                            {t("freeShippingThreshold")}
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₺</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.freeShippingThreshold}
                                onChange={(e) => setFormData({ ...formData, freeShippingThreshold: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 font-bold text-[#1A1A1A] focus:outline-none focus:border-[#C8102E] transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                        <p className="text-xs text-gray-400">{t("thresholdNote")}</p>
                    </div>

                    {/* TRY Bank Transfer Details */}
                    <div className="pt-6 border-t border-gray-200">
                        <h2 className="text-lg font-black text-[#1A1A1A] tracking-tight mb-1">{t("tryBankTransferDetails")}</h2>
                        <p className="text-sm text-gray-400 mb-6">{t("tryBankTransferDesc")}</p>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider block">{t("bankName")}</label>
                                <input
                                    type="text"
                                    value={formData.bankName}
                                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-[#1A1A1A] focus:outline-none focus:border-[#C8102E] transition-colors"
                                    placeholder="e.g. Ziraat Bankasi"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider block">{t("accountHolder")}</label>
                                <input
                                    type="text"
                                    value={formData.accountHolder}
                                    onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-[#1A1A1A] focus:outline-none focus:border-[#C8102E] transition-colors"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider block">{t("iban")}</label>
                                <input
                                    type="text"
                                    value={formData.iban}
                                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono font-medium text-[#1A1A1A] focus:outline-none focus:border-[#C8102E] transition-colors tracking-wider"
                                    placeholder="e.g. TR00 0000 0000 0000 0000 0000 00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider block">{t("additionalNote")}</label>
                                <textarea
                                    value={formData.bankTransferNote}
                                    onChange={(e) => setFormData({ ...formData, bankTransferNote: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-[#1A1A1A] focus:outline-none focus:border-[#C8102E] transition-colors resize-none"
                                    rows={3}
                                    placeholder="e.g. Please include your order number in the transfer description"
                                />
                                <p className="text-xs text-gray-400">{t("additionalNoteHint")}</p>
                            </div>
                        </div>
                    </div>

                    {/* USD Bank Transfer Details */}
                    <div className="pt-6 border-t border-gray-200">
                        <h2 className="text-lg font-black text-[#1A1A1A] tracking-tight mb-1">{t("usdBankTransferDetails")}</h2>
                        <p className="text-sm text-gray-400 mb-2">{t("usdBankTransferDesc")}</p>
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-6">{t("usdAvailableHint")}</p>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider block">{t("bankName")}</label>
                                <input
                                    type="text"
                                    value={formData.usdBankName}
                                    onChange={(e) => setFormData({ ...formData, usdBankName: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-[#1A1A1A] focus:outline-none focus:border-[#C8102E] transition-colors"
                                    placeholder="e.g. Chase Bank"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider block">{t("accountHolder")}</label>
                                <input
                                    type="text"
                                    value={formData.usdAccountHolder}
                                    onChange={(e) => setFormData({ ...formData, usdAccountHolder: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-[#1A1A1A] focus:outline-none focus:border-[#C8102E] transition-colors"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider block">{t("iban")}</label>
                                <input
                                    type="text"
                                    value={formData.usdIban}
                                    onChange={(e) => setFormData({ ...formData, usdIban: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono font-medium text-[#1A1A1A] focus:outline-none focus:border-[#C8102E] transition-colors tracking-wider"
                                    placeholder="e.g. US12 3456 7890 0000 0000 0000 00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider block">{t("swiftCode")}</label>
                                <input
                                    type="text"
                                    value={formData.usdSwiftCode}
                                    onChange={(e) => setFormData({ ...formData, usdSwiftCode: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono font-medium text-[#1A1A1A] focus:outline-none focus:border-[#C8102E] transition-colors tracking-wider uppercase"
                                    placeholder="e.g. CHASUS33"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider block">{t("usdAdditionalNote")}</label>
                                <textarea
                                    value={formData.usdBankTransferNote}
                                    onChange={(e) => setFormData({ ...formData, usdBankTransferNote: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-[#1A1A1A] focus:outline-none focus:border-[#C8102E] transition-colors resize-none"
                                    rows={3}
                                    placeholder="e.g. Please include your order number as the wire reference"
                                />
                                <p className="text-xs text-gray-400">{t("additionalNoteHint")}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider block">{t("usdShippingFee")}</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.usdShippingFee}
                                        onChange={(e) => setFormData({ ...formData, usdShippingFee: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 font-bold text-[#1A1A1A] focus:outline-none focus:border-[#C8102E] transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-xs text-gray-400">{t("usdShippingFeeNote")}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider block">{t("usdFreeShippingThreshold")}</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.usdFreeShippingThreshold}
                                        onChange={(e) => setFormData({ ...formData, usdFreeShippingThreshold: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 font-bold text-[#1A1A1A] focus:outline-none focus:border-[#C8102E] transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-xs text-gray-400">{t("usdThresholdNote")}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-[#C8102E] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#A90D27] active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    {t("saving")}
                                </>
                            ) : (
                                t("saveConfiguration")
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
