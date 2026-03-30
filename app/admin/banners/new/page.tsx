"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@@/components/ui/select";
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
import { ArrowLeft, Check, Loader2, Trash2, Upload } from "lucide-react";

// Helper to extract path from Supabase URL if not explicitly stored
function getPathFromUrl(url: string) {
    try {
        const parts = url.split('/public/products/');
        if (parts.length > 1) {
            return parts[1];
        }
        return null;
    } catch (e) {
        return null;
    }
}

export default function NewBannerPage() {
    const router = useRouter();
    const [imageUrl, setImageUrl] = useState("");
    const [imagePath, setImagePath] = useState(""); // Store path for deletion

    // NOTE: imageFile state was unused in original code except for upload logic? 
    // actually it was used to clear file input, but we can do that better.
    // I'll keep it if needed, but mainly we need imageUrl and imagePath.

    const [imagePreview, setImagePreview] = useState("");

    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [active, setActive] = useState(true);
    const [order, setOrder] = useState("0");
    const [displayMode, setDisplayMode] = useState("cover");
    const [alignment, setAlignment] = useState("center");
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Invalid file type. Only JPEG, PNG, and WebP are allowed");
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error("File too large. Maximum size is 10MB");
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            // Use new Supabase upload
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to upload image");
            }

            const data = await response.json();
            setImageUrl(data.url);
            setImagePath(data.path);
            toast.success("Image uploaded successfully");
        } catch (err: any) {
            toast.error(err.message || "Failed to upload image");
            setImagePreview("");
        } finally {
            setUploading(false);
            // Reset input?
            e.target.value = "";
        }
    };

    const confirmRemoveImage = async () => {
        setIsDeleting(true);
        try {
            const pathToDelete = imagePath || getPathFromUrl(imageUrl);

            if (pathToDelete) {
                const response = await fetch("/api/upload/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path: pathToDelete }),
                });

                if (!response.ok) {
                    console.error("Failed to delete from storage");
                    toast.warning("Removed provided image but failed to delete from storage");
                } else {
                    toast.success("Image removed");
                }
            } else {
                toast.success("Image removed");
            }

            setImageUrl("");
            setImagePath("");
            setImagePreview("");
            setShowDeleteConfirm(false);

        } catch (error: any) {
            console.error(error);
            toast.error("Failed to remove image");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRemoveRequest = () => {
        setShowDeleteConfirm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!imageUrl) {
            toast.error("Please upload a banner image");
            return;
        }

        const orderNumber = parseInt(order);
        if (isNaN(orderNumber) || orderNumber < 0) {
            toast.error("Please enter a valid order number (0 or greater)");
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch("/api/admin/banners", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageUrl,
                    // We don't necessarily send path to DB as schema doesn't support it, 
                    // but we used it for transient state.
                    title: title.trim() || null,
                    subtitle: subtitle.trim() || null,
                    active,
                    order: orderNumber,
                    displayMode,
                    alignment,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create banner");
            }

            toast.success("Banner created successfully! Redirecting...");
            setTimeout(() => {
                router.push("/admin/banners");
            }, 1500);
        } catch (err: any) {
            toast.error(err.message || "Failed to create banner");
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 text-[#1A1A1A] hover:text-[#C8102E] transition-colors font-bold"
                    disabled={submitting}
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">
                    Add New Banner
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                        Banner Image
                    </h2>
                    <p className="text-[#A9A9A9] mb-6">
                        Upload a high-quality banner image for the homepage carousel (Supabase Storage).
                    </p>

                    {!imagePreview && !imageUrl ? (
                        <div className="border-2 border-dashed border-[#A9A9A9] rounded-xl p-12 text-center hover:border-[#C8102E] transition-colors">
                            <input
                                type="file"
                                id="banner-upload"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleFileSelect}
                                disabled={uploading || submitting}
                                className="hidden"
                            />
                            <label
                                htmlFor="banner-upload"
                                className="cursor-pointer flex flex-col items-center"
                            >
                                {uploading ? (
                                    <Loader2 className="w-12 h-12 text-[#C8102E] animate-spin mb-4" />
                                ) : (
                                    <Upload className="w-16 h-16 text-[#A9A9A9] mb-4" />
                                )}
                                <span className="text-lg font-bold text-[#1A1A1A] mb-2">
                                    {uploading ? "Uploading..." : "Click to upload banner image"}
                                </span>
                                <span className="text-sm text-[#A9A9A9]">
                                    JPEG, PNG, or WebP (Max 10MB)
                                </span>
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative aspect-[21/9] bg-[#FAFAFA] rounded-xl overflow-hidden border-2 border-[#E5E5E5]">
                                <Image
                                    src={imagePreview || imageUrl}
                                    alt="Banner preview"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleRemoveRequest}
                                disabled={submitting || isDeleting}
                                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#C8102E] text-[#C8102E] font-bold rounded-xl hover:bg-[#C8102E] hover:text-white transition-all duration-200"
                            >
                                <Trash2 className="w-5 h-5" />
                                Remove Image
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">
                        Banner Details
                    </h2>

                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
                            Title <span className="text-[#A9A9A9] font-normal">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium"
                            placeholder="Enter banner title"
                            disabled={submitting}
                            maxLength={200}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
                            Subtitle <span className="text-[#A9A9A9] font-normal">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium"
                            placeholder="Enter banner subtitle"
                            disabled={submitting}
                            maxLength={200}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
                            Image Resize Mode
                        </label>
                        <Select value={displayMode} onValueChange={setDisplayMode} disabled={submitting}>
                            <SelectTrigger className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium bg-white">
                                <SelectValue placeholder="Select resize mode" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-[#E5E5E5] rounded-xl shadow-lg">
                                <SelectItem value="cover">Cover (recommended)</SelectItem>
                                <SelectItem value="contain">Contain (fit inside)</SelectItem>
                                <SelectItem value="fill">Fill (stretch)</SelectItem>
                                <SelectItem value="scale-down">Scale Down</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
                            Image Focal Point
                        </label>
                        <Select value={alignment} onValueChange={setAlignment} disabled={submitting}>
                            <SelectTrigger className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium bg-white">
                                <SelectValue placeholder="Select focal point" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-[#E5E5E5] rounded-xl shadow-lg">
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="top">Top</SelectItem>
                                <SelectItem value="bottom">Bottom</SelectItem>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                                <SelectItem value="top left">Top Left</SelectItem>
                                <SelectItem value="top right">Top Right</SelectItem>
                                <SelectItem value="bottom left">Bottom Left</SelectItem>
                                <SelectItem value="bottom right">Bottom Right</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
                                Display Order
                            </label>
                            <input
                                type="number"
                                value={order}
                                onChange={(e) => setOrder(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium"
                                placeholder="0"
                                disabled={submitting}
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
                                Status
                            </label>
                            <div className="flex items-center gap-3 h-[50px]">
                                <button
                                    type="button"
                                    onClick={() => setActive(!active)}
                                    disabled={submitting}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${active ? "bg-[#C8102E]" : "bg-[#A9A9A9]"}`}
                                >
                                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${active ? "translate-x-7" : "translate-x-1"}`} />
                                </button>
                                <span className="text-sm font-bold text-[#1A1A1A]">
                                    {active ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 justify-end">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-3 bg-white border-2 border-[#A9A9A9] text-[#1A1A1A] font-bold rounded-xl hover:bg-[#FAFAFA] transition-all duration-200"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-3 bg-[#C8102E] text-white font-bold rounded-xl hover:bg-[#A00D24] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={submitting || uploading || !imageUrl}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating Banner...
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Create Banner
                            </>
                        )}
                    </button>
                </div>
            </form>

            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the uploaded image from storage.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmRemoveImage();
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
