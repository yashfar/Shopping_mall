"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

interface Variant {
    id: string;
    color: string;
    colorHex: string | null;
    stock: number;
    images: string[];
}

interface VariantDraft {
    color: string;
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
    const [price, setPrice] = useState("");
    const [salePrice, setSalePrice] = useState("");
    const [category, setCategory] = useState("");
    const [categoryNameEn, setCategoryNameEn] = useState("");
    const [stock, setStock] = useState("0");
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [thumbnail, setThumbnail] = useState<string>("");

    // Loading states
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Delete state
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Variant state
    const [variants, setVariants] = useState<Variant[]>([]);
    const [editingStock, setEditingStock] = useState<Record<string, string>>({});
    const [newVariant, setNewVariant] = useState<VariantDraft>({ color: "", colorHex: "#000000", stock: "0" });
    const [savingVariant, setSavingVariant] = useState<string | null>(null);

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
                setPrice((product.price / 100).toFixed(2));
                setSalePrice(product.salePrice ? (product.salePrice / 100).toFixed(2) : "");
                setCategory(product.category?.name || product.category || "");
                setStock(product.stock.toString());
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
                    colorHex: newVariant.colorHex,
                    stock: parseInt(newVariant.stock) || 0,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setVariants(prev => [...prev, data.variant]);
            setEditingStock(prev => ({ ...prev, [data.variant.id]: data.variant.stock.toString() }));
            setNewVariant({ color: "", colorHex: "#000000", stock: "0" });
            toast.success("Varyant eklendi");
        } catch (err: any) {
            toast.error(err.message || "Varyant eklenemedi");
        } finally {
            setSavingVariant(null);
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

        if (!title.trim() || !description.trim() || !category.trim()) {
            setError(t("errorRequiredFields"));
            toast.error(t("errorRequiredFields"));
            return;
        }

        const priceInCents = Math.round(parseFloat(price) * 100);
        if (isNaN(priceInCents) || priceInCents <= 0) {
            setError(t("errorInvalidPrice"));
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
                                </div>

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
                            <div className="flex items-center gap-2 mb-4">
                                <Palette className="w-5 h-5 text-gray-400" />
                                <h2 className="text-lg font-semibold text-gray-900">Renk Varyantları</h2>
                                {variants.length > 0 && (
                                    <span className="ml-auto text-sm text-gray-500">
                                        Toplam stok: {variants.reduce((s, v) => s + v.stock, 0)}
                                    </span>
                                )}
                            </div>

                            {/* Existing variants */}
                            {variants.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    {variants.map(v => (
                                        <div key={v.id} className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 ${savingVariant === v.id ? "opacity-50" : ""}`}>
                                            <div className="w-6 h-6 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: v.colorHex || "#ccc" }} />
                                            <span className="font-medium text-gray-900 w-28">{v.color}</span>
                                            <input
                                                type="number"
                                                value={editingStock[v.id] ?? v.stock}
                                                onChange={e => setEditingStock(prev => ({ ...prev, [v.id]: e.target.value }))}
                                                min="0"
                                                className="h-8 px-2 rounded border border-gray-200 text-sm w-20 focus:outline-none focus:border-[#C8102E]"
                                            />
                                            <span className="text-xs text-gray-400">adet</span>
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
                                <Button
                                    type="button"
                                    onClick={addVariant}
                                    disabled={savingVariant === "new" || !newVariant.color.trim()}
                                    className="h-9 bg-[#C8102E] hover:bg-[#A90D27] text-white shrink-0"
                                >
                                    {savingVariant === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Ekle</>}
                                </Button>
                            </div>
                            {variants.length > 0 && (
                                <p className="text-xs text-amber-600 mt-2">Varyantlı ürünlerde ana stok otomatik olarak güncellenir.</p>
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
