"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, Loader2, HelpCircle, Eye, EyeOff, ChevronUp, ChevronDown, Upload, Download } from "lucide-react";
import { Button } from "@@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Faq {
    id: string;
    question: string;
    questionEn: string | null;
    answer: string;
    answerEn: string | null;
    order: number;
    isActive: boolean;
}

const emptyForm = { question: "", questionEn: "", answer: "", answerEn: "", order: 0, isActive: true };

export default function FaqsPage() {
    const t = useTranslations("adminFaqs");
    const [faqs, setFaqs] = useState<Faq[]>([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState(emptyForm);
    const [adding, setAdding] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [confirmFaq, setConfirmFaq] = useState<Faq | null>(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFaqs = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/faqs");
            if (!res.ok) throw new Error();
            const data = await res.json();
            setFaqs(data);
        } catch {
            toast.error(t("failedToLoad"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchFaqs();
    }, [fetchFaqs]);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!form.question.trim() || !form.answer.trim()) return;
        setAdding(true);
        try {
            const res = await fetch("/api/admin/faqs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setFaqs((prev) => [...prev, data]);
            setForm(emptyForm);
            toast.success(t("faqAdded"));
        } catch {
            toast.error(t("failedToAdd"));
        } finally {
            setAdding(false);
        }
    }

    function startEdit(faq: Faq) {
        setEditingId(faq.id);
        setEditForm({
            question: faq.question,
            questionEn: faq.questionEn ?? "",
            answer: faq.answer,
            answerEn: faq.answerEn ?? "",
            order: faq.order,
            isActive: faq.isActive,
        });
    }

    function cancelEdit() {
        setEditingId(null);
        setEditForm(emptyForm);
    }

    async function handleSave(id: string) {
        if (!editForm.question.trim() || !editForm.answer.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/faqs/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setFaqs((prev) => prev.map((f) => (f.id === id ? data : f)));
            setEditingId(null);
            toast.success(t("faqUpdated"));
        } catch {
            toast.error(t("failedToUpdate"));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(faq: Faq) {
        setConfirmFaq(faq);
    }

    async function confirmDelete() {
        if (!confirmFaq) return;
        const faq = confirmFaq;
        setConfirmFaq(null);
        setDeletingId(faq.id);
        try {
            const res = await fetch(`/api/admin/faqs/${faq.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
            toast.success(t("faqDeleted"));
        } catch {
            toast.error(t("failedToDelete"));
        } finally {
            setDeletingId(null);
        }
    }

    async function handleToggleActive(faq: Faq) {
        setTogglingId(faq.id);
        try {
            const res = await fetch(`/api/admin/faqs/${faq.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !faq.isActive }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error();
            setFaqs((prev) => prev.map((f) => (f.id === faq.id ? data : f)));
        } catch {
            toast.error(t("failedToUpdate"));
        } finally {
            setTogglingId(null);
        }
    }

    function downloadTemplate() {
        const header = "question,questionEn,answer,answerEn,order";
        const example = `"Siparişimi ne zaman teslim alırım?","When will I receive my order?","2-5 iş günü içinde teslim edilir.","Delivered within 2-5 business days.",1`;
        const csv = `${header}\n${example}`;
        const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "faq_template.csv";
        a.click();
        URL.revokeObjectURL(url);
    }

    async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";

        setImporting(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/admin/faqs/import", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(t("importSuccess", { count: data.imported }));
            if (data.errors?.length > 0) toast.warning(`${data.errors.length} ${t("importWarnings")}`);
            await fetchFaqs();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t("importFailed"));
        } finally {
            setImporting(false);
        }
    }

    async function handleReorder(faq: Faq, direction: "up" | "down") {
        const index = faqs.findIndex((f) => f.id === faq.id);
        const swapIndex = direction === "up" ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= faqs.length) return;

        const other = faqs[swapIndex];
        const newOrder = other.order;
        const otherOrder = faq.order;

        await Promise.all([
            fetch(`/api/admin/faqs/${faq.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order: newOrder }),
            }),
            fetch(`/api/admin/faqs/${other.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order: otherOrder }),
            }),
        ]);

        const updated = [...faqs];
        updated[index] = { ...faq, order: newOrder };
        updated[swapIndex] = { ...other, order: otherOrder };
        updated.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
        setFaqs(updated);
    }

    const inputClass = "w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all";

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[#1A1A1A]">{t("pageTitle")}</h1>
                    <p className="text-sm text-[#A9A9A9] mt-0.5">{t("pageDesc")}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5 text-gray-600">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("downloadTemplate")}</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importing} className="gap-1.5 text-[#C8102E] border-[#C8102E]/30 hover:bg-red-50">
                        {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        <span className="hidden sm:inline">{t("importCsv")}</span>
                    </Button>
                    <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
                </div>
            </div>

            {/* Add form */}
            <form onSubmit={handleAdd} className="mb-8 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                <p className="text-xs font-semibold text-[#A9A9A9] uppercase tracking-wide mb-1">{t("addNew")}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">🇹🇷 {t("question")}</label>
                        <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder={t("questionPlaceholder")} className={inputClass} disabled={adding} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">🇬🇧 {t("questionEn")}</label>
                        <input value={form.questionEn} onChange={(e) => setForm({ ...form, questionEn: e.target.value })} placeholder={t("questionEnPlaceholder")} className={inputClass} disabled={adding} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">🇹🇷 {t("answer")}</label>
                        <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder={t("answerPlaceholder")} rows={3} className={`${inputClass} resize-none`} disabled={adding} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1">🇬🇧 {t("answerEn")}</label>
                        <textarea value={form.answerEn} onChange={(e) => setForm({ ...form, answerEn: e.target.value })} placeholder={t("answerEnPlaceholder")} rows={3} className={`${inputClass} resize-none`} disabled={adding} />
                    </div>
                </div>

                <Button type="submit" disabled={adding || !form.question.trim() || !form.answer.trim()} className="bg-[#C8102E] hover:bg-[#A90D27] text-white w-full">
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" />{t("add")}</>}
                </Button>
            </form>

            {/* FAQ list */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-[#C8102E]" />
                    </div>
                ) : faqs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <HelpCircle className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm font-medium">{t("noFaqsYet")}</p>
                        <p className="text-xs mt-1">{t("noFaqsDesc")}</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {faqs.map((faq, index) => (
                            <li key={faq.id} className={`px-5 py-4 ${!faq.isActive ? "opacity-50" : ""}`}>
                                {editingId === faq.id ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-500">🇹🇷 {t("question")}</label>
                                                <input value={editForm.question} onChange={(e) => setEditForm({ ...editForm, question: e.target.value })} className={inputClass} autoFocus />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-500">🇬🇧 {t("questionEn")}</label>
                                                <input value={editForm.questionEn} onChange={(e) => setEditForm({ ...editForm, questionEn: e.target.value })} className={inputClass} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-500">🇹🇷 {t("answer")}</label>
                                                <textarea value={editForm.answer} onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })} rows={3} className={`${inputClass} resize-none`} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-500">🇬🇧 {t("answerEn")}</label>
                                                <textarea value={editForm.answerEn} onChange={(e) => setEditForm({ ...editForm, answerEn: e.target.value })} rows={3} className={`${inputClass} resize-none`} />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <Button size="sm" variant="ghost" onClick={() => handleSave(faq.id)} disabled={saving || !editForm.question.trim() || !editForm.answer.trim()} className="text-green-600 hover:bg-green-50">
                                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" />{t("save")}</>}
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving} className="text-gray-400 hover:bg-gray-100">
                                                <X className="h-4 w-4 mr-1" />{t("cancel")}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3">
                                        {/* Reorder buttons */}
                                        <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
                                            <button onClick={() => handleReorder(faq, "up")} disabled={index === 0} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                                                <ChevronUp className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => handleReorder(faq, "down")} disabled={index === faqs.length - 1} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="text-sm font-semibold text-[#1A1A1A]">🇹🇷 {faq.question}</span>
                                                {!faq.questionEn && <span className="text-[10px] text-amber-500 font-medium">🇬🇧 {t("missing")}</span>}
                                            </div>
                                            {faq.questionEn && <p className="text-xs text-blue-600 font-medium mb-1">🇬🇧 {faq.questionEn}</p>}
                                            <p className="text-xs text-gray-500 line-clamp-2">{faq.answer}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button size="icon" variant="ghost" onClick={() => handleToggleActive(faq)} disabled={togglingId === faq.id} title={faq.isActive ? t("deactivate") : t("activate")} className="h-8 w-8 text-gray-400 hover:text-amber-600 hover:bg-amber-50">
                                                {togglingId === faq.id ? <Loader2 className="h-4 w-4 animate-spin" /> : faq.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => startEdit(faq)} className="h-8 w-8 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-100">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(faq)} disabled={deletingId === faq.id} className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30">
                                                {deletingId === faq.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Delete Confirm Modal */}
            {confirmFaq && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmFaq(null)}>
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <Trash2 className="w-5 h-5 text-[#C8102E]" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#1A1A1A] text-base">{t("confirmDeleteTitle")}</h3>
                                <p className="text-xs text-gray-400 mt-0.5">{t("confirmDelete")}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 mb-5 line-clamp-2">
                            {confirmFaq.question}
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setConfirmFaq(null)}>
                                {t("cancel")}
                            </Button>
                            <Button className="flex-1 bg-[#C8102E] hover:bg-[#A90D27] text-white" onClick={confirmDelete}>
                                {t("deleteConfirm")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
