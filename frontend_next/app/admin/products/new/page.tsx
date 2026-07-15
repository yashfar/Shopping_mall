"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@@/components/ui/button";
import { ArrowLeft, Upload, X, Check, Loader2, Trash2, Plus, Palette } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@@/components/ui/alert-dialog";

interface UploadedImage {
    url: string;
    path?: string;
    file?: File;
}

interface VariantDraft {
    tempId: string;
    color: string;
    colorHex: string;
    stock: string;
}

export default function NewProductPage() {
    const router = useRouter();
    const t = useTranslations("adminProductForm");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [titleEn, setTitleEn] = useState("");
    const [descriptionEn, setDescriptionEn] = useState("");
    const [contentTab, setContentTab] = useState<"tr" | "en">("tr");
    const [price, setPrice] = useState("");
    const [salePrice, setSalePrice] = useState("");
    const [category, setCategory] = useState("");
    const [categoryNameEn, setCategoryNameEn] = useState("");
    const [stock, setStock] = useState("0");
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [thumbnail, setThumbnail] = useState<string>("");

    // Loading states
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Delete confirmation state
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Variant state
    const [hasVariants, setHasVariants] = useState(false);
    const [variants, setVariants] = useState<VariantDraft[]>([]);
    const [newVariant, setNewVariant] = useState<VariantDraft>({ tempId: "", color: "", colorHex: "#000000", stock: "0" });

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/categories");
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data);
                }
            } catch (error) {
                console.error("Failed to fetch categories", error);
                toast.error(t("failedToLoadCategories"));
            }
        };
        fetchCategories();
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setError("");

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const formData = new FormData();
                formData.append("file", file);

                // Use the new Supabase upload endpoint
                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || t("failedToUploadImages"));
                }

                const data = await response.json();
                return { url: data.url, path: data.path, file };
            });

            const uploadedImages = await Promise.all(uploadPromises);
            setImages((prev) => [...prev, ...uploadedImages]);

            // Auto-select first image as thumbnail if none selected
            if (!thumbnail && uploadedImages.length > 0) {
                setThumbnail(uploadedImages[0].url);
            }

            toast.success(t("imagesUploaded", { count: uploadedImages.length }));
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || t("failedToUploadImages"));
            setError(err.message || t("failedToUploadImages"));
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const confirmDeleteImage = async () => {
        if (!deleteId) return;
        setIsDeleting(true);

        const imageIndex = images.findIndex((img) => img.url === deleteId);
        if (imageIndex === -1) {
            setDeleteId(null);
            setIsDeleting(false);
            return;
        }

        const image = images[imageIndex];

        try {
            // Delete from Supabase if we have a path
            if (image.path) {
                const response = await fetch("/api/upload/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path: image.path }),
                });

                if (!response.ok) {
                    throw new Error("Failed to delete image from storage");
                }
            }

            // Update UI
            setImages((prev) => prev.filter((img) => img.url !== deleteId));
            if (thumbnail === deleteId) {
                const remaining = images.filter((img) => img.url !== deleteId);
                setThumbnail(remaining.length > 0 ? remaining[0].url : "");
            }

            toast.success(t("imageDeleted"));
        } catch (err: any) {
            console.error(err);
            toast.error(t("failedToDeleteImage"));
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const handleSetThumbnail = (url: string) => {
        setThumbnail(url);
        toast.info(t("thumbnailUpdated"));
    };

    const addVariant = () => {
        if (!newVariant.color.trim()) return;
        setVariants(prev => [...prev, { ...newVariant, tempId: crypto.randomUUID() }]);
        setNewVariant({ tempId: "", color: "", colorHex: "#000000", stock: "0" });
    };

    const removeVariant = (tempId: string) => {
        setVariants(prev => prev.filter(v => v.tempId !== tempId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Frontend Validation
        if (images.length === 0) {
            setError(t("errorNoImages"));
            toast.error(t("errorNoImages"));
            return;
        }

        if (!thumbnail) {
            setError(t("errorNoThumbnail"));
            toast.error(t("errorNoThumbnail"));
            return;
        }

        if (!title.trim() || !description.trim() || !category.trim()) {
            setError(t("errorRequiredFields"));
            toast.error(t("errorRequiredFields"));
            return;
        }

        const priceInCents = Math.round(parseFloat(price) * 100);
        if (isNaN(priceInCents) || priceInCents <= 0) {
            setError(t("errorInvalidPrice"));
            toast.error(t("errorInvalidPrice"));
            return;
        }

        let salePriceInCents: number | null = null;
        if (salePrice.trim()) {
            salePriceInCents = Math.round(parseFloat(salePrice) * 100);
            if (isNaN(salePriceInCents) || salePriceInCents <= 0) {
                setError(t("errorInvalidSalePrice"));
                return;
            }
            if (salePriceInCents >= priceInCents) {
                setError(t("errorSalePriceTooHigh"));
                return;
            }
        }

        const stockNumber = hasVariants
            ? variants.reduce((s, v) => s + (parseInt(v.stock) || 0), 0)
            : parseInt(stock);
        if (isNaN(stockNumber) || stockNumber < 0) {
            setError(t("errorInvalidStock"));
            toast.error(t("errorInvalidStock"));
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch("/api/admin/product/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    titleEn: titleEn.trim() || null,
                    descriptionEn: descriptionEn.trim() || null,
                    price: priceInCents,
                    salePrice: salePriceInCents,
                    category: category.trim(),
                    categoryNameEn: categoryNameEn.trim() || null,
                    stock: stockNumber,
                    images: images.map((img) => img.url),
                    thumbnail,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.details) {
                    const detailMessages = data.details.map((d: any) => `${d.field}: ${d.message}`).join(", ");
                    throw new Error(detailMessages || "Validation failed");
                }
                throw new Error(data.error || t("failedToCreateProduct"));
            }

            // Create variants if any
            if (hasVariants && variants.length > 0) {
                const productId = data.product.id;
                await Promise.all(variants.map(v =>
                    fetch(`/api/admin/products/${productId}/variants`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            color: v.color,
                            colorHex: v.colorHex,
                            stock: parseInt(v.stock) || 0,
                        }),
                    })
                ));
            }

            toast.success(t("productCreated"));
            setTimeout(() => {
                router.push("/admin/products");
            }, 1500);
        } catch (err: any) {
            setError(err.message || t("failedToCreateProduct"));
            toast.error(err.message || t("failedToCreateProduct"));
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100">
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t("addNewProduct")}</h1>
                        <p className="text-sm text-gray-500">{t("addNewProductDesc")}</p>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                    <X className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Images */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("productImages")}</h2>
                            <p className="text-sm text-gray-500 mb-4">
                                {t("imagesDesc")}
                            </p>

                            {/* Image Upload Area */}
                            <div className="relative mb-6">
                                <input
                                    type="file"
                                    id="image-upload"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileSelect}
                                    disabled={uploading || submitting}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="image-upload"
                                    className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploading
                                        ? "border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed"
                                        : "border-gray-300 hover:border-[#C8102E] hover:bg-gray-50"
                                        }`}
                                >
                                    {uploading ? (
                                        <Loader2 className="h-8 w-8 text-[#C8102E] animate-spin mb-2" />
                                    ) : (
                                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                    )}
                                    <span className="text-sm font-medium text-gray-700">
                                        {uploading ? t("uploading") : t("clickToUpload")}
                                    </span>
                                    <span className="text-xs text-gray-500 mt-1">{t("maxFileSize")}</span>
                                </label>
                            </div>

                            {/* Image Grid */}
                            <div className="grid grid-cols-2 gap-4 max-h-[320px] overflow-y-auto">
                                {images.map((img) => (
                                    <div
                                        key={img.url}
                                        className={`group relative aspect-square rounded-lg overflow-hidden border transition-all ${thumbnail === img.url
                                            ? "border-[#C8102E] ring-2 ring-[#C8102E]/20"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <Image
                                            src={img.url}
                                            alt="Product"
                                            fill
                                            className="object-cover"
                                        />

                                        {/* Actions */}
                                        {thumbnail !== img.url && (
                                            <>
                                                <div className="hidden lg:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="secondary"
                                                        className="bg-white/90 hover:bg-white text-gray-900 shadow-sm backdrop-blur-[2px]"
                                                        onClick={() => handleSetThumbnail(img.url)}
                                                    >
                                                        {t("setThumbnail")}
                                                    </Button>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="lg:hidden absolute bottom-2 right-12 h-8 px-3 rounded-full shadow-md z-20 bg-white hover:bg-yellow-50 text-yellow-600 border border-gray-200 text-xs font-medium"
                                                    onClick={() => handleSetThumbnail(img.url)}
                                                >
                                                    {t("thumbnailBtn")}
                                                </Button>
                                            </>
                                        )}

                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="destructive"
                                            className="absolute bottom-2 right-2 h-8 w-8 rounded-full shadow-md z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                                            onClick={() => setDeleteId(img.url)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>

                                        {thumbnail === img.url && (
                                            <div className="absolute top-2 right-2 bg-[#C8102E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
                                                {t("main")}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">{t("productInformation")}</h2>

                            <div className="space-y-6">
                                {/* Language Tabs */}
                                <div>
                                    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setContentTab("tr")}
                                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${contentTab === "tr" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                        >
                                            🇹🇷 Türkçe
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setContentTab("en")}
                                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${contentTab === "en" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                        >
                                            🇬🇧 English
                                            {titleEn && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                                        </button>
                                    </div>

                                    {contentTab === "tr" && (
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                                    {t("productTitle")} <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="title"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                                    placeholder={t("productTitlePlaceholder")}
                                                    required
                                                    disabled={submitting}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                                    {t("description")} <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    id="description"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    rows={6}
                                                    className="w-full p-3 rounded-md border border-gray-200 bg-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                                    placeholder={t("descriptionPlaceholder")}
                                                    required
                                                    disabled={submitting}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {contentTab === "en" && (
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="titleEn" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Product Title <span className="text-gray-400 font-normal">(optional)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="titleEn"
                                                    value={titleEn}
                                                    onChange={(e) => setTitleEn(e.target.value)}
                                                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                                    placeholder="Enter product title in English..."
                                                    disabled={submitting}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="descriptionEn" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Description <span className="text-gray-400 font-normal">(optional)</span>
                                                </label>
                                                <textarea
                                                    id="descriptionEn"
                                                    value={descriptionEn}
                                                    onChange={(e) => setDescriptionEn(e.target.value)}
                                                    rows={6}
                                                    className="w-full p-3 rounded-md border border-gray-200 bg-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                                    placeholder="Enter product description in English..."
                                                    disabled={submitting}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Row: Price, Sale Price & Stock */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div>
                                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                                            {t("priceUSD")} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                            <input
                                                type="number"
                                                id="price"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                step="0.01"
                                                min="0"
                                                className="w-full h-10 pl-7 pr-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                                placeholder="0.00"
                                                required
                                                disabled={submitting}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 mb-1">
                                            {t("salePrice")} <span className="text-gray-400 font-normal">{t("optional")}</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                            <input
                                                type="number"
                                                id="salePrice"
                                                value={salePrice}
                                                onChange={(e) => setSalePrice(e.target.value)}
                                                step="0.01"
                                                min="0"
                                                className="w-full h-10 pl-7 pr-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                                placeholder="0.00"
                                                disabled={submitting}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                                            {t("stockQuantity")} {!hasVariants && <span className="text-red-500">*</span>}
                                        </label>
                                        {hasVariants ? (
                                            <div className="h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm flex items-center text-gray-500">
                                                {variants.reduce((s, v) => s + (parseInt(v.stock) || 0), 0)} (varyantlardan otomatik)
                                            </div>
                                        ) : (
                                            <input
                                                type="number"
                                                id="stock"
                                                value={stock}
                                                onChange={(e) => setStock(e.target.value)}
                                                min="0"
                                                className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                                placeholder="0"
                                                required
                                                disabled={submitting}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                        {t("category")} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="category"
                                            list="category-suggestions"
                                            value={category}
                                            onChange={(e) => {
                                                setCategory(e.target.value);
                                                // Clear EN name when category changes
                                                if (categories.some(c => c.name.toLowerCase() === e.target.value.toLowerCase())) {
                                                    setCategoryNameEn("");
                                                }
                                            }}
                                            className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                            placeholder={t("categoryPlaceholder")}
                                            required
                                            disabled={submitting}
                                            autoComplete="off"
                                        />
                                        <datalist id="category-suggestions">
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.name} />
                                            ))}
                                        </datalist>
                                    </div>
                                    {/* Show EN name field only for new categories */}
                                    {category.trim() && !categories.some(c => c.name.toLowerCase() === category.trim().toLowerCase()) && (
                                        <div className="mt-2">
                                            <div className="flex items-center gap-1 mb-1">
                                                <span className="text-xs font-medium text-amber-600">🆕 Yeni kategori</span>
                                                <span className="text-xs text-gray-400">— İngilizce ismini de gir:</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm shrink-0">🇬🇧</span>
                                                <input
                                                    type="text"
                                                    value={categoryNameEn}
                                                    onChange={(e) => setCategoryNameEn(e.target.value)}
                                                    placeholder="English category name (optional)"
                                                    maxLength={100}
                                                    disabled={submitting}
                                                    className="flex-1 h-9 px-3 rounded-md border border-amber-200 bg-amber-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-400 transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Variants Section */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-gray-400" />
                                    <h2 className="text-lg font-semibold text-gray-900">Renk Varyantları</h2>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <div
                                        onClick={() => setHasVariants(v => !v)}
                                        className={`relative w-10 h-5 rounded-full transition-colors ${hasVariants ? "bg-[#C8102E]" : "bg-gray-200"}`}
                                    >
                                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasVariants ? "translate-x-5" : ""}`} />
                                    </div>
                                    <span className="text-sm text-gray-600">Bu üründe renk varyantları var</span>
                                </label>
                            </div>

                            {hasVariants && (
                                <div className="space-y-4">
                                    {/* Variant List */}
                                    {variants.length > 0 && (
                                        <div className="space-y-2">
                                            {variants.map(v => (
                                                <div key={v.tempId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className="w-6 h-6 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: v.colorHex }} />
                                                    <span className="font-medium text-gray-900 flex-1">{v.color}</span>
                                                    <span className="text-sm text-gray-500 w-20 text-right">Stok: {v.stock}</span>
                                                    <button type="button" onClick={() => removeVariant(v.tempId)} className="text-red-500 hover:text-red-700 p-1">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add New Variant Row */}
                                    <div className="flex items-end gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-600">Renk Adı</label>
                                            <input
                                                type="text"
                                                value={newVariant.color}
                                                onChange={e => setNewVariant(v => ({ ...v, color: e.target.value }))}
                                                placeholder="Siyah"
                                                className="h-9 px-3 rounded-md border border-gray-200 text-sm w-32 focus:outline-none focus:border-[#C8102E]"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-600">Renk</label>
                                            <input
                                                type="color"
                                                value={newVariant.colorHex}
                                                onChange={e => setNewVariant(v => ({ ...v, colorHex: e.target.value }))}
                                                className="h-9 w-14 rounded-md border border-gray-200 cursor-pointer p-0.5"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-600">Stok</label>
                                            <input
                                                type="number"
                                                value={newVariant.stock}
                                                onChange={e => setNewVariant(v => ({ ...v, stock: e.target.value }))}
                                                min="0"
                                                className="h-9 px-3 rounded-md border border-gray-200 text-sm w-24 focus:outline-none focus:border-[#C8102E]"
                                            />
                                        </div>
                                        <Button type="button" onClick={addVariant} className="h-9 bg-[#C8102E] hover:bg-[#A90D27] text-white shrink-0">
                                            <Plus className="w-4 h-4 mr-1" /> Ekle
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-400">Varyant eklenince Stok alanı otomatik olarak yok sayılır.</p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={submitting}
                                className="w-full sm:w-auto"
                            >
                                {t("cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting || uploading}
                                className="w-full sm:w-auto bg-[#C8102E] hover:bg-[#A90D27] text-white min-w-[140px]"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t("creating")}
                                    </>
                                ) : (
                                    t("createProduct")
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("deleteImageTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("deleteImageDesc")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDeleteImage();
                            }}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? t("deleting") : t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
