"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Plus, X, Loader2, Check, Languages } from "lucide-react";
import { Button } from "@@/components/ui/button";
import { toast } from "sonner";

export interface CategoryOption {
    id: string;
    name: string;
    nameEn?: string | null;
}

interface CategoryComboboxProps {
    categories: CategoryOption[];
    value: string | null;
    onChange: (id: string | null) => void;
    onCategoryCreated: (cat: CategoryOption) => void;
    disabled?: boolean;
    placeholder?: string;
    locale?: "tr" | "en";
}

export function CategoryCombobox({
    categories,
    value,
    onChange,
    onCategoryCreated,
    disabled = false,
    placeholder,
    locale = "tr",
}: CategoryComboboxProps) {
    const isEn = locale === "en";

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [newTrName, setNewTrName] = useState("");
    const [newEnName, setNewEnName] = useState("");
    const [creating, setCreating] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [createError, setCreateError] = useState("");

    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const trInputRef = useRef<HTMLInputElement>(null);
    const enInputRef = useRef<HTMLInputElement>(null);

    const selected = categories.find((c) => c.id === value) ?? null;

    // Show EN name in trigger when in EN mode
    const triggerLabel = selected
        ? (isEn && selected.nameEn ? selected.nameEn : selected.name)
        : null;

    const resolvedPlaceholder = placeholder ?? (isEn ? "Select or create category..." : "Kategori seçin veya oluşturun...");

    const filtered = search.trim()
        ? categories.filter(
              (c) =>
                  c.name.toLowerCase().includes(search.toLowerCase()) ||
                  (c.nameEn?.toLowerCase().includes(search.toLowerCase()) ?? false)
          )
        : categories;

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch("");
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    useEffect(() => {
        if (open) setTimeout(() => searchInputRef.current?.focus(), 0);
    }, [open]);

    useEffect(() => {
        if (showCreate) {
            setTimeout(() => {
                if (isEn) enInputRef.current?.focus();
                else trInputRef.current?.focus();
            }, 0);
        }
    }, [showCreate, isEn]);

    function openCreate() {
        setOpen(false);
        const term = search.trim();
        if (isEn) {
            setNewEnName(term);
            setNewTrName("");
        } else {
            setNewTrName(term);
            setNewEnName("");
        }
        setSearch("");
        setCreateError("");
        setShowCreate(true);
    }

    function closeCreate() {
        setShowCreate(false);
        setNewTrName("");
        setNewEnName("");
        setCreateError("");
    }

    async function handleTranslateToTurkish() {
        if (!newEnName.trim()) return;
        setTranslating(true);
        try {
            const res = await fetch("/api/admin/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ texts: [newEnName.trim()], from: "EN", to: "TR" }),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setNewTrName(data.translations[0] ?? "");
            toast.success("Translated to Turkish!");
        } catch {
            toast.error("Translation failed.");
        } finally {
            setTranslating(false);
        }
    }

    async function handleCreate() {
        const trName = newTrName.trim();
        const enName = newEnName.trim();

        if (!trName && !enName) {
            setCreateError(isEn ? "Category name is required." : "Kategori adı zorunludur.");
            return;
        }
        if (!trName) {
            setCreateError(isEn ? "Please translate to Turkish first." : "Türkçe kategori adı zorunludur.");
            return;
        }

        setCreateError("");
        setCreating(true);
        try {
            const res = await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    translations: [
                        { locale: "tr", name: trName },
                        ...(enName ? [{ locale: "en", name: enName }] : []),
                    ],
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? (isEn ? "Failed to create category." : "Kategori oluşturulamadı."));

            const trTrans = data.translations?.find((t: any) => t.locale === "tr");
            const enTrans = data.translations?.find((t: any) => t.locale === "en");
            const created: CategoryOption = {
                id: data.id,
                name: trTrans?.name ?? trName,
                nameEn: enTrans?.name ?? (enName || null),
            };

            onCategoryCreated(created);
            onChange(created.id);
            toast.success(isEn ? `Category created: ${created.nameEn ?? created.name}` : `Kategori oluşturuldu: ${created.name}`);
            closeCreate();
        } catch (err: any) {
            setCreateError(err.message ?? (isEn ? "Unexpected error." : "Beklenmeyen hata."));
        } finally {
            setCreating(false);
        }
    }

    return (
        <>
            <div ref={containerRef} className="relative">
                {/* Trigger */}
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setOpen((o) => !o)}
                    className={[
                        "w-full flex items-center gap-2 h-10 px-3 rounded-md border text-sm text-left transition-all",
                        disabled
                            ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200"
                            : "bg-white border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]",
                        open ? "border-[#C8102E] ring-2 ring-[#C8102E]/20" : "",
                    ].filter(Boolean).join(" ")}
                >
                    {triggerLabel ? (
                        <>
                            <span className="flex-1 text-gray-900 truncate">{triggerLabel}</span>
                            {!disabled && (
                                <span
                                    role="button"
                                    tabIndex={-1}
                                    onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }}
                                    className="text-gray-400 hover:text-gray-600 shrink-0"
                                >
                                    <X className="h-4 w-4" />
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="flex-1 text-gray-400">{resolvedPlaceholder}</span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown */}
                {open && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 flex flex-col max-h-64 overflow-hidden">
                        <div className="p-2 border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-2 h-8 px-2.5 rounded-md border border-gray-200 bg-gray-50">
                                <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={isEn ? "Search..." : "Ara..."}
                                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                                />
                                {search && (
                                    <button type="button" onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {filtered.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">{isEn ? "No results" : "Sonuç yok"}</p>
                            ) : (
                                filtered.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => { onChange(cat.id); setOpen(false); setSearch(""); }}
                                        className={[
                                            "w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors",
                                            cat.id === value ? "bg-red-50 text-[#C8102E]" : "text-gray-900 hover:bg-gray-50",
                                        ].join(" ")}
                                    >
                                        <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                                            {cat.id === value && <Check className="h-3.5 w-3.5" />}
                                        </span>
                                        {/* Show EN name first when in EN mode */}
                                        {isEn ? (
                                            <>
                                                <span className="flex-1">{cat.nameEn ?? cat.name}</span>
                                                {cat.nameEn && <span className="text-xs text-gray-400 shrink-0">{cat.name}</span>}
                                            </>
                                        ) : (
                                            <>
                                                <span className="flex-1">{cat.name}</span>
                                                {cat.nameEn && <span className="text-xs text-gray-400 shrink-0">{cat.nameEn}</span>}
                                            </>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="border-t border-gray-100 shrink-0">
                            <button
                                type="button"
                                onClick={openCreate}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#C8102E] font-medium hover:bg-red-50 transition-colors"
                            >
                                <Plus className="h-4 w-4 shrink-0" />
                                {isEn ? "Create new category" : "Yeni kategori oluştur"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create modal */}
            {showCreate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <h3 className="text-base font-semibold text-gray-900">
                                {isEn ? "Create New Category" : "Yeni Kategori Oluştur"}
                            </h3>
                            <button type="button" onClick={closeCreate} disabled={creating} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {createError && (
                                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                                    {createError}
                                </div>
                            )}

                            {isEn ? (
                                /* EN mode: English field first */
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-gray-100 text-gray-500 leading-none">EN</span>
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            ref={enInputRef}
                                            type="text"
                                            value={newEnName}
                                            onChange={(e) => setNewEnName(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
                                            placeholder="English category name"
                                            maxLength={100}
                                            disabled={creating}
                                            className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-gray-100 text-gray-500 leading-none">TR</span>
                                            İsim <span className="text-red-500">*</span>
                                        </label>

                                        {!newTrName.trim() && newEnName.trim() ? (
                                            <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-md">
                                                <Languages className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                <p className="text-xs text-blue-700 flex-1">Turkish name required</p>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleTranslateToTurkish}
                                                    disabled={translating || creating}
                                                    className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                                                >
                                                    {translating ? (
                                                        <><Loader2 className="h-3 w-3 animate-spin mr-1" />Translating...</>
                                                    ) : (
                                                        <><Languages className="h-3 w-3 mr-1" />Translate</>
                                                    )}
                                                </Button>
                                            </div>
                                        ) : null}

                                        <input
                                            ref={trInputRef}
                                            type="text"
                                            value={newTrName}
                                            onChange={(e) => setNewTrName(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
                                            placeholder="Türkçe kategori adı"
                                            maxLength={100}
                                            disabled={creating}
                                            className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                        />
                                    </div>
                                </>
                            ) : (
                                /* TR mode: Turkish field first (original layout) */
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-gray-100 text-gray-500 leading-none">TR</span>
                                            İsim <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            ref={trInputRef}
                                            type="text"
                                            value={newTrName}
                                            onChange={(e) => setNewTrName(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
                                            placeholder="Türkçe kategori adı"
                                            maxLength={100}
                                            disabled={creating}
                                            className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-gray-100 text-gray-500 leading-none">EN</span>
                                            Name <span className="text-gray-400 font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newEnName}
                                            onChange={(e) => setNewEnName(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
                                            placeholder="English name (optional)"
                                            maxLength={100}
                                            disabled={creating}
                                            className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-2 pt-1">
                                <Button type="button" variant="ghost" className="flex-1" disabled={creating} onClick={closeCreate}>
                                    {isEn ? "Cancel" : "İptal"}
                                </Button>
                                <Button
                                    type="button"
                                    disabled={creating || (!newTrName.trim() && !newEnName.trim())}
                                    onClick={handleCreate}
                                    className="flex-1 bg-[#C8102E] hover:bg-[#A90D27] text-white"
                                >
                                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEn ? "Create" : "Oluştur")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
