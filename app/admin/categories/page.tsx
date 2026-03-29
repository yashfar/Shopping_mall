"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, Loader2, Tag } from "lucide-react";
import { Button } from "@@/components/ui/button";
import { toast } from "sonner";

interface Category {
    id: string;
    name: string;
    _count: { products: number };
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // New category
    const [newName, setNewName] = useState("");
    const [adding, setAdding] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [saving, setSaving] = useState(false);

    // Delete state
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/categories");
            if (!res.ok) throw new Error();
            const data = await res.json();
            setCategories(data);
        } catch {
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;
        setAdding(true);
        try {
            const res = await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
            setNewName("");
            toast.success(`"${data.name}" added`);
        } catch (err: any) {
            toast.error(err.message || "Failed to add category");
        } finally {
            setAdding(false);
        }
    }

    function startEdit(cat: Category) {
        setEditingId(cat.id);
        setEditName(cat.name);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditName("");
    }

    async function handleSave(id: string) {
        if (!editName.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/categories/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setCategories((prev) =>
                prev.map((c) => (c.id === id ? data : c)).sort((a, b) => a.name.localeCompare(b.name))
            );
            setEditingId(null);
            toast.success("Category updated");
        } catch (err: any) {
            toast.error(err.message || "Failed to update category");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(cat: Category) {
        setDeletingId(cat.id);
        try {
            const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setCategories((prev) => prev.filter((c) => c.id !== cat.id));
            toast.success(`"${cat.name}" deleted`);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete category");
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-[#1A1A1A]">Categories</h1>
                    <p className="text-sm text-[#A9A9A9] mt-0.5">Add, rename or delete product categories</p>
                </div>
            </div>

            {/* Add new category */}
            <form onSubmit={handleAdd} className="flex gap-2 mb-8">
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New category name..."
                    maxLength={100}
                    disabled={adding}
                    className="flex-1 h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                />
                <Button
                    type="submit"
                    disabled={adding || !newName.trim()}
                    className="bg-[#C8102E] hover:bg-[#A90D27] text-white px-4"
                >
                    {adding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <><Plus className="h-4 w-4 mr-1" /> Add</>
                    )}
                </Button>
            </form>

            {/* Category list */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-[#C8102E]" />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Tag className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm font-medium">No categories yet</p>
                        <p className="text-xs mt-1">Add your first category above</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {categories.map((cat) => (
                            <li key={cat.id} className="flex items-center gap-3 px-4 py-3">
                                {editingId === cat.id ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSave(cat.id);
                                                if (e.key === "Escape") cancelEdit();
                                            }}
                                            maxLength={100}
                                            autoFocus
                                            className="flex-1 h-9 px-3 rounded-md border border-[#C8102E] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 transition-all"
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleSave(cat.id)}
                                            disabled={saving || !editName.trim()}
                                            className="h-8 w-8 text-green-600 hover:bg-green-50"
                                        >
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={cancelEdit}
                                            disabled={saving}
                                            className="h-8 w-8 text-gray-400 hover:bg-gray-100"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-[#1A1A1A]">{cat.name}</span>
                                            <span className="ml-2 text-xs text-[#A9A9A9]">
                                                {cat._count.products} product{cat._count.products !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => startEdit(cat)}
                                            className="h-8 w-8 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-100"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleDelete(cat)}
                                            disabled={deletingId === cat.id || cat._count.products > 0}
                                            title={cat._count.products > 0 ? "Remove all products from this category first" : "Delete"}
                                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            {deletingId === cat.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {categories.length > 0 && (
                <p className="text-xs text-[#A9A9A9] mt-3 text-center">
                    Categories with products cannot be deleted. Remove all products first.
                </p>
            )}
        </div>
    );
}
