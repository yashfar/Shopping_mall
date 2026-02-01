"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
    AlertDialogTrigger,
} from "@@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@@/components/ui/select";

interface Banner {
    id: string;
    imageUrl: string;
    title: string | null;
    subtitle: string | null;
    active: boolean;
    order: number;
    displayMode: string;
    alignment: string;
    createdAt: Date;
}

export default function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [banner, setBanner] = useState<Banner | null>(null);
    const [bannerId, setBannerId] = useState<string>("");
    const [imageUrl, setImageUrl] = useState("");
    const [imagePreview, setImagePreview] = useState("");
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [active, setActive] = useState(true);
    const [order, setOrder] = useState("0");
    const [displayMode, setDisplayMode] = useState("cover");
    const [alignment, setAlignment] = useState("center");
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Fetch banner data
    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const resolvedParams = await params;
                setBannerId(resolvedParams.id);

                const response = await fetch(`/api/admin/banners/${resolvedParams.id}`);

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to fetch banner");
                }

                const data = await response.json();
                setBanner(data);
                setImageUrl(data.imageUrl);
                setImagePreview(data.imageUrl);
                setTitle(data.title || "");
                setSubtitle(data.subtitle || "");
                setActive(data.active);
                setOrder(data.order.toString());
                setDisplayMode(data.displayMode || "cover");
                setAlignment(data.alignment || "center");
            } catch (err: any) {
                toast.error(err.message || "Failed to load banner");
                router.push("/admin/banners");
            } finally {
                setLoading(false);
            }
        };

        fetchBanner();
    }, [params, router]);

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

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/admin/upload/banner-image", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to upload image");
            }

            const data = await response.json();
            setImageUrl(data.url);
            toast.success("Image uploaded successfully");
        } catch (err: any) {
            toast.error(err.message || "Failed to upload image");
            // Restore original preview on error
            setImagePreview(imageUrl);
        } finally {
            setUploading(false);
        }
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
            const response = await fetch(`/api/admin/banners/${bannerId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageUrl,
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
                throw new Error(data.error || "Failed to update banner");
            }

            toast.success("Banner updated successfully! Redirecting...");
            setTimeout(() => {
                router.push("/admin/banners");
            }, 1500);
        } catch (err: any) {
            toast.error(err.message || "Failed to update banner");
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);

        try {
            const response = await fetch(`/api/admin/banners/${bannerId}/delete`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete banner");
            }

            toast.success("Banner deleted successfully! Redirecting...");
            setTimeout(() => {
                router.push("/admin/banners");
            }, 1000);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete banner");
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-[#C8102E] border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!banner) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 text-[#1A1A1A] hover:text-[#C8102E] transition-colors font-bold"
                        disabled={submitting || deleting}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                            />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] tracking-tight">
                        Edit Banner
                    </h1>
                </div>

                {/* Delete Button */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <button
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-[#C8102E] text-[#C8102E] font-bold rounded-xl hover:bg-[#C8102E] hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                            disabled={submitting || deleting}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                />
                            </svg>
                            Delete Banner
                        </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-2 border-[#E5E5E5] rounded-2xl w-[90vw] md:w-full">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black text-[#1A1A1A]">
                                Delete Banner?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-[#A9A9A9] text-base">
                                This action cannot be undone. This will permanently delete the banner
                                from the carousel.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="border-2 border-[#A9A9A9] font-bold rounded-xl hover:bg-[#FAFAFA]">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={deleting}
                                className="bg-[#C8102E] hover:bg-[#A00D24] font-bold rounded-xl"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Image Upload Section */}
                <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                        Banner Image
                    </h2>
                    <p className="text-[#A9A9A9] mb-6">
                        Current banner image. Click to replace with a new image.
                    </p>

                    <div className="space-y-4">
                        <div className="relative aspect-[21/9] bg-[#FAFAFA] rounded-xl overflow-hidden border-2 border-[#E5E5E5]">
                            <Image
                                src={imagePreview}
                                alt="Banner preview"
                                fill
                                className="object-cover"
                            />
                            {uploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <input
                                type="file"
                                id="banner-upload"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleFileSelect}
                                disabled={uploading || submitting || deleting}
                                className="hidden"
                            />
                            <label
                                htmlFor="banner-upload"
                                className="w-full md:w-auto flex justify-center items-center gap-2 px-6 py-3 bg-white border-2 border-[#C8102E] text-[#C8102E] font-bold rounded-xl hover:bg-[#C8102E] hover:text-white transition-all duration-200 cursor-pointer"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                                    />
                                </svg>
                                {uploading ? "Uploading..." : "Replace Image"}
                            </label>
                        </div>
                    </div>
                </div>

                {/* Banner Details Section */}
                <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-6 md:p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">
                        Banner Details
                    </h2>

                    {/* Title */}
                    <div>
                        <label
                            htmlFor="title"
                            className="block text-sm font-bold text-[#1A1A1A] mb-2"
                        >
                            Title <span className="text-[#A9A9A9] font-normal">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium"
                            placeholder="Enter banner title"
                            disabled={submitting || deleting}
                            maxLength={200}
                        />
                    </div>

                    {/* Subtitle */}
                    <div>
                        <label
                            htmlFor="subtitle"
                            className="block text-sm font-bold text-[#1A1A1A] mb-2"
                        >
                            Subtitle <span className="text-[#A9A9A9] font-normal">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            id="subtitle"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium"
                            placeholder="Enter banner subtitle"
                            disabled={submitting || deleting}
                            maxLength={200}
                        />
                    </div>

                    {/* Image Resize Mode */}
                    <div>
                        <label
                            htmlFor="displayMode"
                            className="block text-sm font-bold text-[#1A1A1A] mb-2"
                        >
                            Image Resize Mode
                        </label>
                        <Select value={displayMode} onValueChange={setDisplayMode} disabled={submitting || deleting}>
                            <SelectTrigger className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium bg-white">
                                <SelectValue placeholder="Select resize mode" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-[#E5E5E5] rounded-xl shadow-lg">
                                <SelectItem value="cover" className="cursor-pointer hover:bg-[#FAFAFA] font-medium">
                                    Cover (recommended)
                                </SelectItem>
                                <SelectItem value="contain" className="cursor-pointer hover:bg-[#FAFAFA] font-medium">
                                    Contain (fit inside)
                                </SelectItem>
                                <SelectItem value="fill" className="cursor-pointer hover:bg-[#FAFAFA] font-medium">
                                    Fill (stretch)
                                </SelectItem>
                                <SelectItem value="scale-down" className="cursor-pointer hover:bg-[#FAFAFA] font-medium">
                                    Scale Down
                                </SelectItem>
                                <SelectItem value="none" className="cursor-pointer hover:bg-[#FAFAFA] font-medium">
                                    None
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-[#A9A9A9] mt-1">
                            How the image should fill the banner space
                        </p>
                    </div>

                    {/* Image Focal Point */}
                    <div>
                        <label
                            htmlFor="alignment"
                            className="block text-sm font-bold text-[#1A1A1A] mb-2"
                        >
                            Image Focal Point
                        </label>
                        <Select value={alignment} onValueChange={setAlignment} disabled={submitting || deleting}>
                            <SelectTrigger className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium bg-white">
                                <SelectValue placeholder="Select focal point" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-[#E5E5E5] rounded-xl shadow-lg">
                                <SelectItem value="center" className="cursor-pointer hover:bg-[#FAFAFA] font-medium">
                                    Center
                                </SelectItem>
                                <SelectItem value="top" className="cursor-pointer hover:bg-[#FAFAFA] font-medium">
                                    Top
                                </SelectItem>
                                <SelectItem value="bottom" className="cursor-pointer hover:bg-[#FAFAFA] font-medium">
                                    Bottom
                                </SelectItem>
                                <SelectItem value="left" className="cursor-pointer hover:bg-[#FAFAFA] font-medium">
                                    Left
                                </SelectItem>
                                <SelectItem value="right" className="cursor-pointer hover:bg-[#FAFAFA] font-medium">
                                    Right
                                </SelectItem>
                                <SelectItem value="top left" className="cursor-pointer hover:bg-[#FAFAFA] font-medium">
                                    Top Left
                                </SelectItem>
                                <SelectItem value="top right" className="cursor-pointer hover:bg-[#FAFAFA] font-medium">
                                    Top Right
                                </SelectItem>
                                <SelectItem value="bottom left" className="cursor-pointer hover:bg-[#FAFAFA] font-medium">
                                    Bottom Left
                                </SelectItem>
                                <SelectItem value="bottom right" className="cursor-pointer hover:bg-[#FAFAFA] font-medium">
                                    Bottom Right
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-[#A9A9A9] mt-1">
                            Which part of the image to focus on
                        </p>
                    </div>

                    {/* Order and Active Toggle Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Order */}
                        <div>
                            <label
                                htmlFor="order"
                                className="block text-sm font-bold text-[#1A1A1A] mb-2"
                            >
                                Display Order
                            </label>
                            <input
                                type="number"
                                id="order"
                                value={order}
                                onChange={(e) => setOrder(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium"
                                placeholder="0"
                                disabled={submitting || deleting}
                                min="0"
                            />
                            <p className="text-xs text-[#A9A9A9] mt-1">
                                Lower numbers appear first
                            </p>
                        </div>

                        {/* Active Toggle */}
                        <div>
                            <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
                                Status
                            </label>
                            <div className="flex items-center gap-3 h-[50px]">
                                <button
                                    type="button"
                                    onClick={() => setActive(!active)}
                                    disabled={submitting || deleting}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${active ? "bg-[#C8102E]" : "bg-[#A9A9A9]"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${active ? "translate-x-7" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                                <span className="text-sm font-bold text-[#1A1A1A]">
                                    {active ? "Active" : "Inactive"}
                                </span>
                            </div>
                            <p className="text-xs text-[#A9A9A9] mt-1">
                                {active ? "Banner will be visible" : "Banner will be hidden"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 justify-end">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-3 bg-white border-2 border-[#A9A9A9] text-[#1A1A1A] font-bold rounded-xl hover:bg-[#FAFAFA] transition-all duration-200"
                        disabled={submitting || deleting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-3 bg-[#C8102E] text-white font-bold rounded-xl hover:bg-[#A00D24] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={submitting || uploading || deleting || !imageUrl}
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving Changes...
                            </>
                        ) : (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4.5 12.75l6 6 9-13.5"
                                    />
                                </svg>
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
