"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@@/components/ui/button";
import { ArrowLeft, Upload, X, Check, Loader2, Trash2, Plus, Palette, Languages } from "lucide-react";
import { CategoryCombobox, type CategoryOption } from "@@/components/CategoryCombobox";
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

interface Variant {
    id: string;
    color: string;
    colorEn: string | null;
    colorHex: string | null;
    stock: number;
    images: string[];
}

interface VariantDraft {
    color: string;
    colorEn: string;
    colorHex: string;
    stock: string;
}

// Helper to extract path from Supabase URL if not explicitly stored
function getPathFromUrl(url: string) {
    try {
        // Expected format: .../public/products/products/filename
        const parts = url.split('/public/products/');
        if (parts.length > 1) {
            return parts[1];
        }
        return null;
    } catch (e) {
        return null;
    }
}

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const t = useTranslations("adminProductForm");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [titleEn, setTitleEn] = useState("");
    const [descriptionEn, setDescriptionEn] = useState("");
    const [contentTab, setContentTab] = useState<"tr" | "en">("tr");
    const [priceTRY, setPriceTRY] = useState("");
    const [salePriceTRY, setSalePriceTRY] = useState("");
    const [priceUSD, setPriceUSD] = useState("");
    const [salePriceUSD, setSalePriceUSD] = useState("");
    const [missingUSD, setMissingUSD] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [stock, setStock] = useState("0");
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [thumbnail, setThumbnail] = useState<string>("");

    // Loading states
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Delete state
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [shippingDays, setShippingDays] = useState("3-5");

    // Variant state
    const [variants, setVariants] = useState<Variant[]>([]);
    const [editingStock, setEditingStock] = useState<Record<string, string>>({});
    const [newVariant, setNewVariant] = useState<VariantDraft>({ color: "", colorEn: "", colorHex: "#000000", stock: "0" });
    const [variantTranslating, setVariantTranslating] = useState(false);
    const [savingVariant, setSavingVariant] = useState<string | null>(null);
    const [translating, setTranslating] = useState(false);
    const [bannerHighlighted, setBannerHighlighted] = useState(false);
    const translateBannerRef = useRef<HTMLDivElement>(null);

    // Fetch product details
    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;

            try {
                const response = await fetch(`/api/admin/products/${id}`);
                if (!response.ok) {
                    throw new Error(t("failedToLoadProduct"));
                }
                const data = await response.json();
                const product = data.product;

                setTitle(product.title);
                setDescription(product.description || "");
                const enTranslation = product.translations?.find((tr: any) => tr.locale === "en");
                setTitleEn(enTranslation?.title || "");
                setDescriptionEn(enTranslation?.description || "");
                const tryEntry = product.prices?.find((p: any) => p.currencyCode === "TRY");
                const usdEntry = product.prices?.find((p: any) => p.currencyCode === "USD");
                // Fall back to Product.price if no TRY ProductPrice row yet
                setPriceTRY(tryEntry ? (tryEntry.price / 100).toFixed(2) : (product.price / 100).toFixed(2));
                setSalePriceTRY(tryEntry?.salePrice ? (tryEntry.salePrice / 100).toFixed(2) : (product.salePrice ? (product.salePrice / 100).toFixed(2) : ""));
                if (usdEntry) {
                    setPriceUSD((usdEntry.price / 100).toFixed(2));
                    setSalePriceUSD(usdEntry.salePrice ? (usdEntry.salePrice / 100).toFixed(2) : "");
                    setMissingUSD(false);
                } else {
                    setMissingUSD(true);
                }
                setSelectedCategoryId(product.category?.id ?? null);
                setStock(product.stock.toString());
                setShippingDays(product.shippingDays || "3-5");
                setThumbnail(product.thumbnail || "");

                if (product.images && Array.isArray(product.images)) {
                    setImages(product.images.map((img: any) => ({
                        url: img.url,
                        path: img.path || getPathFromUrl(img.url)
                    })));
                } else {
                    setImages([]);
                }

                if (product.variants && Array.isArray(product.variants)) {
                    setVariants(product.variants);
                    const stockMap: Record<string, string> = {};
                    product.variants.forEach((v: Variant) => {
                        stockMap[v.id] = v.stock.toString();
                    });
                    setEditingStock(stockMap);
                }
            } catch (err: any) {
                setError(err.message || t("failedToLoadProduct"));
                toast.error(err.message || t("failedToLoadProduct"));
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    // Fetch categories (admin endpoint for full TR+EN data needed by the combobox search)
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/admin/categories");
                if (response.ok) {
                    const data = await response.json();
                    setCategories(
                        data.map((cat: any) => ({
                            id: cat.id,
                            name: cat.name,
                            nameEn: cat.nameEn ?? null,
                        }))
                    );
                }
            } catch (error) {
                console.error("Failed to fetch categories", error);
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

            if (!thumbnail && uploadedImages.length > 0) {
                setThumbnail(uploadedImages[0].url);
            }

            toast.success(t("imagesUploaded", { count: uploadedImages.length }));
        } catch (err: any) {
            setError(err.message || t("failedToUploadImages"));
            toast.error(err.message);
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
            const pathToDelete = image.path || getPathFromUrl(image.url);

            if (pathToDelete) {
                const response = await fetch("/api/upload/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path: pathToDelete }),
                });

                if (!response.ok) {
                    console.error("Failed to delete from storage");
                    toast.warning(t("storageDeleteWarning"));
                } else {
                    toast.success(t("imageRemoved"));
                }
            } else {
                toast.success(t("imageRemovedFromList"));
            }

            setImages((prev) => prev.filter((img) => img.url !== deleteId));
            if (thumbnail === deleteId) {
                const remaining = images.filter((img) => img.url !== deleteId);
                setThumbnail(remaining.length > 0 ? remaining[0].url : "");
            }

        } catch (err: any) {
            console.error(err);
            toast.error(t("failedToRemoveImage"));
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const handleSetThumbnail = (url: string) => {
        setThumbnail(url);
        toast.info(t("thumbnailSelected"));
    };

    const addVariant = async () => {
        if (!newVariant.color.trim() || !id) return;
        setSavingVariant("new");
        try {
            const res = await fetch(`/api/admin/products/${id}/variants`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    color: newVariant.color.trim(),
                    colorEn: newVariant.colorEn.trim() || null,
                    colorHex: newVariant.colorHex,
                    stock: parseInt(newVariant.stock) || 0,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setVariants(prev => [...prev, data.variant]);
            setEditingStock(prev => ({ ...prev, [data.variant.id]: data.variant.stock.toString() }));
            setNewVariant({ color: "", colorEn: "", colorHex: "#000000", stock: "0" });
            toast.success(contentTab === "tr" ? "Varyant eklendi" : "Variant added");
        } catch (err: any) {
            toast.error(err.message || "Varyant eklenemedi");
        } finally {
            setSavingVariant(null);
        }
    };

    const handleTranslateVariantColor = async (direction: "toEn" | "toTr") => {
        const sourceText = direction === "toEn" ? newVariant.color.trim() : newVariant.colorEn.trim();
        if (!sourceText) return;
        setVariantTranslating(true);
        try {
            const res = await fetch("/api/admin/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    texts: [sourceText],
                    from: direction === "toEn" ? "TR" : "EN",
                    to: direction === "toEn" ? "EN" : "TR",
                }),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            if (direction === "toEn") {
                setNewVariant(v => ({ ...v, colorEn: data.translations[0] ?? "" }));
            } else {
                setNewVariant(v => ({ ...v, color: data.translations[0] ?? "" }));
            }
        } catch {
            toast.error("Çeviri başarısız.");
        } finally {
            setVariantTranslating(false);
        }
    };

    const saveVariantStock = async (variantId: string) => {
        if (!id) return;
        setSavingVariant(variantId);
        try {
            const res = await fetch(`/api/admin/products/${id}/variants`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ variantId, stock: parseInt(editingStock[variantId]) || 0 }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setVariants(prev => prev.map(v => v.id === variantId ? { ...v, stock: data.variant.stock } : v));
            toast.success("Stok güncellendi");
        } catch (err: any) {
            toast.error(err.message || "Stok güncellenemedi");
        } finally {
            setSavingVariant(null);
        }
    };

    const deleteVariant = async (variantId: string) => {
        if (!id) return;
        setSavingVariant(variantId);
        try {
            const res = await fetch(`/api/admin/products/${id}/variants`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ variantId }),
            });
            if (!res.ok) throw new Error("Silinemedi");
            setVariants(prev => prev.filter(v => v.id !== variantId));
            toast.success("Varyant silindi");
        } catch (err: any) {
            toast.error(err.message || "Varyant silinemedi");
        } finally {
            setSavingVariant(null);
        }
    };

    const handleTranslateToTurkish = async () => {
        if (!titleEn.trim()) return;
        setTranslating(true);
        try {
            const res = await fetch("/api/admin/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    texts: [titleEn.trim(), descriptionEn.trim() || titleEn.trim()],
                    from: "EN",
                    to: "TR",
                }),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setTitle(data.translations[0] ?? "");
            setDescription(data.translations[1] ?? "");
            toast.success("Türkçeye çevrildi! Kontrol edip düzenleyebilirsiniz.");
        } catch {
            toast.error("Çeviri sırasında bir hata oluştu.");
        } finally {
            setTranslating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

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

        if (!title.trim() || !description.trim() || !selectedCategoryId) {
            if (!title.trim() && titleEn.trim()) {
                setContentTab("tr");
                setTimeout(() => {
                    translateBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    setBannerHighlighted(true);
                    setTimeout(() => setBannerHighlighted(false), 1500);
                }, 50);
                toast.error("Please fill in Turkish fields or use the Translate button.");
            } else {
                setError(t("errorRequiredFields"));
                toast.error(t("errorRequiredFields"));
            }
            return;
        }

        const tryPriceInCents = Math.round(parseFloat(priceTRY) * 100);
        if (isNaN(tryPriceInCents) || tryPriceInCents <= 0) {
            setError("TRY fiyatı geçersiz.");
            return;
        }
        let trySalePriceInCents: number | null = null;
        if (salePriceTRY.trim()) {
            trySalePriceInCents = Math.round(parseFloat(salePriceTRY) * 100);
            if (isNaN(trySalePriceInCents) || trySalePriceInCents <= 0 || trySalePriceInCents >= tryPriceInCents) {
                setError("TRY indirimli fiyat geçersiz.");
                return;
            }
        }

        const pricesToSave: Array<{ currencyCode: string; price: number; salePrice: number | null }> = [
            { currencyCode: "TRY", price: tryPriceInCents, salePrice: trySalePriceInCents },
        ];

        if (priceUSD.trim()) {
            const usdPriceInCents = Math.round(parseFloat(priceUSD) * 100);
            if (isNaN(usdPriceInCents) || usdPriceInCents <= 0) {
                setError("USD fiyatı geçersiz.");
                return;
            }
            let usdSalePriceInCents: number | null = null;
            if (salePriceUSD.trim()) {
                usdSalePriceInCents = Math.round(parseFloat(salePriceUSD) * 100);
                if (isNaN(usdSalePriceInCents) || usdSalePriceInCents <= 0 || usdSalePriceInCents >= usdPriceInCents) {
                    setError("USD indirimli fiyat geçersiz.");
                    return;
                }
            }
            pricesToSave.push({ currencyCode: "USD", price: usdPriceInCents, salePrice: usdSalePriceInCents });
        }

        const stockNumber = variants.length > 0
            ? variants.reduce((s, v) => s + v.stock, 0)
            : parseInt(stock);
        if (isNaN(stockNumber) || stockNumber < 0) {
            setError(t("errorInvalidStock"));
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(`/api/admin/products/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    titleEn: titleEn.trim() || null,
                    descriptionEn: descriptionEn.trim() || null,
                    prices: pricesToSave,
                    categoryId: selectedCategoryId,
                    stock: stockNumber,
                    shippingDays: shippingDays.trim() || "3-5",
                    images: images.map((img) => img.url),
                    thumbnail,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t("failedToUpdateProduct"));
            }

            toast.success(t("productUpdated"));
            setTimeout(() => {
                router.push("/admin/products");
            }, 1000);
        } catch (err: any) {
            setError(err.message || t("failedToUpdateProduct"));
            toast.error(err.message);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50dvh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#C8102E]" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100">
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t("editProduct")}</h1>
                        <p className="text-sm text-gray-500">{t("editProductDesc")}</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                    <X className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("productImages")}</h2>
                            <p className="text-sm text-gray-500 mb-4">
                                {t("imagesDescEdit")}
                            </p>

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
                                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${contentTab === "tr" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                        >
                                            TR Türkçe
                                            {!title && titleEn && <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />}
                                            {title && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setContentTab("en")}
                                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${contentTab === "en" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                        >
                                            EN English
                                            {titleEn && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                                        </button>
                                    </div>

                                    {contentTab === "tr" && (
                                        <div className="space-y-4">
                                            {!title.trim() && titleEn.trim() && (
                                                <div
                                                    ref={translateBannerRef}
                                                    className={`flex items-center gap-3 p-3.5 bg-blue-50 border rounded-lg transition-all duration-300 ${bannerHighlighted ? "border-blue-500 ring-2 ring-blue-400 ring-offset-2 scale-[1.01]" : "border-blue-200"}`}
                                                >
                                                    <Languages className="h-4 w-4 text-blue-500 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-blue-900">Turkish fields are empty</p>
                                                        <p className="text-xs text-blue-600 mt-0.5">Auto-translate from your English content.</p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={handleTranslateToTurkish}
                                                        disabled={translating || submitting}
                                                        className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3"
                                                    >
                                                        {translating ? (
                                                            <><Loader2 className="h-3 w-3 animate-spin mr-1.5" />Translating...</>
                                                        ) : (
                                                            <><Languages className="h-3 w-3 mr-1.5" />Translate to Turkish</>
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
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

                                {/* Pricing Section */}
                                <div className="space-y-4 p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                                    <h3 className="text-sm font-semibold text-gray-800">{t("pricing") || "Fiyatlandırma"}</h3>

                                    {missingUSD && (
                                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700 font-medium">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                            </svg>
                                            Bu ürün için USD fiyatı girilmemiş. Storefront'ta USD seçilince fiyat gösterilmeyecek.
                                        </div>
                                    )}

                                    {/* TRY */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                {contentTab === "tr" ? "TRY Fiyat" : "TRY Price"} <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₺</span>
                                                <input
                                                    type="number"
                                                    value={priceTRY}
                                                    onChange={(e) => setPriceTRY(e.target.value)}
                                                    step="0.01" min="0"
                                                    className="w-full h-10 pl-7 pr-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                                    placeholder="0.00"
                                                    required disabled={submitting}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                {contentTab === "tr" ? "TRY İndirimli" : "TRY Sale"} <span className="text-gray-400 font-normal">{contentTab === "tr" ? "(isteğe bağlı)" : "(optional)"}</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₺</span>
                                                <input
                                                    type="number"
                                                    value={salePriceTRY}
                                                    onChange={(e) => setSalePriceTRY(e.target.value)}
                                                    step="0.01" min="0"
                                                    className="w-full h-10 pl-7 pr-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                                    placeholder="0.00"
                                                    disabled={submitting}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* USD */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                {contentTab === "tr" ? "USD Fiyat" : "USD Price"} <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                                <input
                                                    type="number"
                                                    value={priceUSD}
                                                    onChange={(e) => { setPriceUSD(e.target.value); if (e.target.value) setMissingUSD(false); }}
                                                    step="0.01" min="0"
                                                    className="w-full h-10 pl-7 pr-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                                    placeholder="0.00"
                                                    disabled={submitting}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                {contentTab === "tr" ? "USD İndirimli" : "USD Sale"} <span className="text-gray-400 font-normal">{contentTab === "tr" ? "(isteğe bağlı)" : "(optional)"}</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                                <input
                                                    type="number"
                                                    value={salePriceUSD}
                                                    onChange={(e) => setSalePriceUSD(e.target.value)}
                                                    step="0.01" min="0"
                                                    className="w-full h-10 pl-7 pr-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                                    placeholder="0.00"
                                                    disabled={submitting}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stock */}
                                <div>
                                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                                        {t("stockQuantity")} {variants.length === 0 && <span className="text-red-500">*</span>}
                                    </label>
                                    {variants.length > 0 ? (
                                        <div className="h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm flex items-center text-gray-500">
                                            {variants.reduce((s, v) => s + v.stock, 0)} (varyantlardan otomatik)
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t("category")} <span className="text-red-500">*</span>
                                    </label>
                                    <CategoryCombobox
                                        categories={categories}
                                        value={selectedCategoryId}
                                        onChange={setSelectedCategoryId}
                                        locale={contentTab}
                                        onCategoryCreated={(cat) =>
                                            setCategories((prev) =>
                                                [...prev, cat].sort((a, b) => a.name.localeCompare(b.name))
                                            )
                                        }
                                        disabled={submitting}
                                    />
                                </div>

                                {/* Shipping Days */}
                                <div>
                                    <label htmlFor="shippingDays" className="block text-sm font-medium text-gray-700 mb-1">
                                        Kargo Süresi (İş Günü) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            id="shippingDays"
                                            value={shippingDays}
                                            onChange={(e) => setShippingDays(e.target.value)}
                                            className="w-40 h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                            placeholder="3-5"
                                            disabled={submitting}
                                        />
                                        <span className="text-sm text-gray-500">iş günü</span>
                                    </div>
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        {["1-2", "3-5", "7-10", "10-14"].map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setShippingDays(preset)}
                                                className={`px-3 py-1 text-xs rounded-full border font-medium transition-all ${
                                                    shippingDays === preset
                                                        ? "bg-[#C8102E] text-white border-[#C8102E]"
                                                        : "bg-white text-gray-600 border-gray-200 hover:border-[#C8102E] hover:text-[#C8102E]"
                                                }`}
                                            >
                                                {preset} gün
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Variants Section */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Palette className="w-5 h-5 text-gray-400" />
                                <h2 className="text-lg font-semibold text-gray-900">{contentTab === "tr" ? "Renk Varyantları" : "Color Variants"}</h2>
                                {variants.length > 0 && (
                                    <span className="ml-auto text-sm text-gray-500">
                                        {contentTab === "tr" ? `Toplam stok: ${variants.reduce((s, v) => s + v.stock, 0)}` : `Total stock: ${variants.reduce((s, v) => s + v.stock, 0)}`}
                                    </span>
                                )}
                            </div>

                            {/* Existing variants */}
                            {variants.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    {variants.map(v => (
                                        <div key={v.id} className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 ${savingVariant === v.id ? "opacity-50" : ""}`}>
                                            <div className="w-6 h-6 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: v.colorHex || "#ccc" }} />
                                            <div className="flex-1 min-w-0">
                                                <span className="font-medium text-gray-900">{v.color}</span>
                                                {v.colorEn && <span className="text-gray-400 text-sm ml-2">/ {v.colorEn}</span>}
                                            </div>
                                            <input
                                                type="number"
                                                value={editingStock[v.id] ?? v.stock}
                                                onChange={e => setEditingStock(prev => ({ ...prev, [v.id]: e.target.value }))}
                                                min="0"
                                                className="h-8 px-2 rounded border border-gray-200 text-sm w-20 focus:outline-none focus:border-[#C8102E]"
                                            />
                                            <span className="text-xs text-gray-400">{contentTab === "tr" ? "adet" : "pcs"}</span>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => saveVariantStock(v.id)}
                                                disabled={savingVariant === v.id}
                                                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                            >
                                                {savingVariant === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                            </Button>
                                            <button
                                                type="button"
                                                onClick={() => deleteVariant(v.id)}
                                                disabled={savingVariant === v.id}
                                                className="text-red-500 hover:text-red-700 p-1 ml-auto"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add new variant row */}
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                                <div className="flex items-end gap-3 flex-wrap">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600">TR {contentTab === "tr" ? "Renk Adı" : "Color Name"} <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={newVariant.color}
                                            onChange={e => setNewVariant(v => ({ ...v, color: e.target.value }))}
                                            placeholder="Siyah"
                                            className="h-9 px-3 rounded-md border border-gray-200 text-sm w-28 focus:outline-none focus:border-[#C8102E]"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600">EN {contentTab === "tr" ? "Renk Adı" : "Color Name"}</label>
                                        <input
                                            type="text"
                                            value={newVariant.colorEn}
                                            onChange={e => setNewVariant(v => ({ ...v, colorEn: e.target.value }))}
                                            placeholder="Black"
                                            className="h-9 px-3 rounded-md border border-gray-200 text-sm w-28 focus:outline-none focus:border-[#C8102E]"
                                        />
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleTranslateVariantColor("toEn")}
                                            disabled={variantTranslating || !newVariant.color.trim()}
                                            title={contentTab === "tr" ? "TR → EN çevir" : "Translate TR → EN"}
                                            className="h-9 px-2 rounded-md border border-gray-200 text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 transition-colors"
                                        >
                                            {variantTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : "TR→EN"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTranslateVariantColor("toTr")}
                                            disabled={variantTranslating || !newVariant.colorEn.trim()}
                                            title={contentTab === "tr" ? "EN → TR çevir" : "Translate EN → TR"}
                                            className="h-9 px-2 rounded-md border border-gray-200 text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 transition-colors"
                                        >
                                            {variantTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : "EN→TR"}
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600">{contentTab === "tr" ? "Renk" : "Color"}</label>
                                        <input
                                            type="color"
                                            value={newVariant.colorHex}
                                            onChange={e => setNewVariant(v => ({ ...v, colorHex: e.target.value }))}
                                            className="h-9 w-14 rounded-md border border-gray-200 cursor-pointer p-0.5"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium text-gray-600">{contentTab === "tr" ? "Stok" : "Stock"}</label>
                                        <input
                                            type="number"
                                            value={newVariant.stock}
                                            onChange={e => setNewVariant(v => ({ ...v, stock: e.target.value }))}
                                            min="0"
                                            className="h-9 px-3 rounded-md border border-gray-200 text-sm w-24 focus:outline-none focus:border-[#C8102E]"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={addVariant}
                                        disabled={savingVariant === "new" || !newVariant.color.trim()}
                                        className="h-9 bg-[#C8102E] hover:bg-[#A90D27] text-white shrink-0"
                                    >
                                        {savingVariant === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> {contentTab === "tr" ? "Ekle" : "Add"}</>}
                                    </Button>
                                </div>
                            </div>
                            {variants.length > 0 && (
                                <p className="text-xs text-amber-600 mt-2">{contentTab === "tr" ? "Varyantlı ürünlerde ana stok otomatik olarak güncellenir." : "In products with variants, total stock is updated automatically."}</p>
                            )}
                        </div>

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
                                        {t("saving")}
                                    </>
                                ) : (
                                    t("saveChanges")
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
