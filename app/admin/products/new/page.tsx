"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@@/components/ui/button";
import { ArrowLeft, Upload, X, Check, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
    path?: string; // Supabase storage path
    file?: File;
}

export default function NewProductPage() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("");
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
                toast.error("Failed to load categories");
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
                    throw new Error(data.error || "Failed to upload image");
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

            toast.success(`${uploadedImages.length} image(s) uploaded successfully`);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to upload images");
            setError(err.message || "Failed to upload images");
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

            toast.success("Image deleted successfully");
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to delete image");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const handleSetThumbnail = (url: string) => {
        setThumbnail(url);
        toast.info("Thumbnail updated");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Frontend Validation
        if (images.length === 0) {
            setError("Please upload at least one product image");
            toast.error("Please upload at least one product image");
            return;
        }

        if (!thumbnail) {
            setError("Please select a thumbnail image");
            toast.error("Please select a thumbnail image");
            return;
        }

        if (!title.trim() || !description.trim() || !category.trim()) {
            setError("Please fill in all required fields");
            toast.error("Please fill in all required fields");
            return;
        }

        const priceInCents = Math.round(parseFloat(price) * 100);
        if (isNaN(priceInCents) || priceInCents <= 0) {
            setError("Please enter a valid positive price");
            toast.error("Please enter a valid positive price");
            return;
        }

        const stockNumber = parseInt(stock);
        if (isNaN(stockNumber) || stockNumber < 0) {
            setError("Please enter a valid stock quantity");
            toast.error("Please enter a valid stock quantity");
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
                    price: priceInCents,
                    category: category.trim(),
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
                throw new Error(data.error || "Failed to create product");
            }

            toast.success("Product created successfully!");
            setTimeout(() => {
                router.push("/admin/products");
            }, 1500);
        } catch (err: any) {
            setError(err.message || "Failed to create product");
            toast.error(err.message || "Failed to create product");
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
                        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
                        <p className="text-sm text-gray-500">Create a new product, add details and images</p>
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
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>
                            <p className="text-sm text-gray-500 mb-4">
                                Upload product images (Supabase Storage). Select the star icon to set the thumbnail.
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
                                        {uploading ? "Uploading..." : "Click to upload"}
                                    </span>
                                    <span className="text-xs text-gray-500 mt-1">MAX 5MB per file</span>
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
                                                        Set Thumbnail
                                                    </Button>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="lg:hidden absolute bottom-2 right-12 h-8 px-3 rounded-full shadow-md z-20 bg-white hover:bg-yellow-50 text-yellow-600 border border-gray-200 text-xs font-medium"
                                                    onClick={() => handleSetThumbnail(img.url)}
                                                >
                                                    Thumbnail
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
                                                MAIN
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
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Product Information</h2>

                            <div className="space-y-6">
                                {/* Title */}
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                        Product Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                        placeholder="E.g., Wireless Noise-Canceling Headphones"
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={6}
                                        className="w-full p-3 rounded-md border border-gray-200 bg-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                        placeholder="Describe the product features, specs, etc."
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                {/* Row: Price & Stock */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                                            Price (USD) <span className="text-red-500">*</span>
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
                                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                                            Stock Quantity <span className="text-red-500">*</span>
                                        </label>
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
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="category"
                                            list="category-suggestions"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] transition-all"
                                            placeholder="Select or type a category..."
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
                                </div>
                            </div>
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
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting || uploading}
                                className="w-full sm:w-auto bg-[#C8102E] hover:bg-[#A90D27] text-white min-w-[140px]"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Product"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this image from storage. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDeleteImage();
                            }}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
