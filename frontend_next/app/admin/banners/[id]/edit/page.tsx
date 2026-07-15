"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
    AlertDialogTrigger,
} from "@@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@@/components/ui/select";
import { Loader2, Upload } from "lucide-react";

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

// Helper: Extract Supabase storage path from URL
function getPathFromUrl(url: string) {
    try {
        const parts = url.split('/public/products/');
        if (parts.length > 1) return parts[1];
        return null;
    } catch (e) {
        return null;
    }
}

export default function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const t = useTranslations("adminBanners");
    const [loading, setLoading] = useState(true);
    const [banner, setBanner] = useState<Banner | null>(null);
    const [bannerId, setBannerId] = useState<string>("");

    const [imageUrl, setImageUrl] = useState("");
    const [originalImageUrl, setOriginalImageUrl] = useState("");
    const [imagePath, setImagePath] = useState("");
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
                    throw new Error(data.error || t("failedToLoadBanner"));
                }

                const data = await response.json();
                setBanner(data);
                setImageUrl(data.imageUrl);
                setOriginalImageUrl(data.imageUrl);
                setImagePreview(data.imageUrl);
                setTitle(data.title || "");
                setSubtitle(data.subtitle || "");
                setActive(data.active);
                setOrder(data.order.toString());
                setDisplayMode(data.displayMode || "cover");
                setAlignment(data.alignment || "center");
            } catch (err: any) {
                toast.error(err.message || t("failedToLoadBanner"));
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

        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            toast.error(t("invalidFileType"));
            return;
        }

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error(t("fileTooLarge"));
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || t("failedToUploadImage"));
            }

            const data = await response.json();
            setImageUrl(data.url);
            setImagePath(data.path);
            toast.success(t("imageUploaded"));
        } catch (err: any) {
            toast.error(err.message || t("failedToUploadImage"));
            setImagePreview(imageUrl);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!imageUrl) {
            toast.error(t("pleaseUploadBannerImage"));
            return;
        }

        const orderNumber = parseInt(order);
        if (isNaN(orderNumber) || orderNumber < 0) {
            toast.error(t("invalidOrderNumber"));
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
                throw new Error(data.error || t("failedToUpdateBanner"));
            }

            if (originalImageUrl && originalImageUrl !== imageUrl) {
                const oldPath = getPathFromUrl(originalImageUrl);
                if (oldPath) {
                    fetch("/api/upload/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ path: oldPath }),
                    }).catch(console.error);
                }
            }

            toast.success(t("bannerUpdated"));
            setTimeout(() => {
                router.push("/admin/banners");
            }, 1500);
        } catch (err: any) {
            toast.error(err.message || t("failedToUpdateBanner"));
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
                throw new Error(data.error || t("failedToDeleteBanner"));
            }

            const pathToDelete = getPathFromUrl(imageUrl);
            if (pathToDelete) {
                await fetch("/api/upload/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path: pathToDelete }),
                });
            }

            toast.success(t("bannerDeletedRedirect"));
            setTimeout(() => {
                router.push("/admin/banners");
            }, 1000);
        } catch (err: any) {
            toast.error(err.message || t("failedToDeleteBanner"));
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-12 h-12 text-[#C8102E] animate-spin" />
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
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        {t("back")}
                    </button>
                    <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] tracking-tight">
                        {t("editBanner")}
                    </h1>
                </div>

                {/* Delete Button */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <button
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-[#C8102E] text-[#C8102E] font-bold rounded-xl hover:bg-[#C8102E] hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                            disabled={submitting || deleting}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            {t("deleteBanner")}
                        </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-2 border-[#E5E5E5] rounded-2xl w-[90vw] md:w-full">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black text-[#1A1A1A]">
                                {t("deleteBannerTitle")}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-[#A9A9A9] text-base">
                                {t("deleteBannerDesc")}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="border-2 border-[#A9A9A9] font-bold rounded-xl hover:bg-[#FAFAFA]">
                                {t("cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={deleting}
                                className="bg-[#C8102E] hover:bg-[#A00D24] font-bold rounded-xl"
                            >
                                {deleting ? t("deleting") : t("delete")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Image Upload Section */}
                <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                        {t("bannerImage")}
                    </h2>
                    <p className="text-[#A9A9A9] mb-6">
                        {t("currentBannerImageDesc")}
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
                                <Upload className="w-5 h-5" />
                                {uploading ? t("uploading") : t("replaceImage")}
                            </label>
                        </div>
                    </div>
                </div>

                {/* Banner Details Section */}
                <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-6 md:p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">
                        {t("bannerDetails")}
                    </h2>

                    <div>
                        <label htmlFor="title" className="block text-sm font-bold text-[#1A1A1A] mb-2">
                            {t("titleLabel")} <span className="text-[#A9A9A9] font-normal">{t("optional")}</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium"
                            placeholder={t("titlePlaceholder")}
                            disabled={submitting || deleting}
                            maxLength={200}
                        />
                    </div>

                    <div>
                        <label htmlFor="subtitle" className="block text-sm font-bold text-[#1A1A1A] mb-2">
                            {t("subtitleLabel")} <span className="text-[#A9A9A9] font-normal">{t("optional")}</span>
                        </label>
                        <input
                            type="text"
                            id="subtitle"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium"
                            placeholder={t("subtitlePlaceholder")}
                            disabled={submitting || deleting}
                            maxLength={200}
                        />
                    </div>

                    <div>
                        <label htmlFor="displayMode" className="block text-sm font-bold text-[#1A1A1A] mb-2">
                            {t("imageResizeMode")}
                        </label>
                        <Select value={displayMode} onValueChange={setDisplayMode} disabled={submitting || deleting}>
                            <SelectTrigger className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium bg-white">
                                <SelectValue placeholder={t("selectResizeMode")} />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-[#E5E5E5] rounded-xl shadow-lg">
                                <SelectItem value="cover">{t("coverOption")}</SelectItem>
                                <SelectItem value="contain">{t("containOption")}</SelectItem>
                                <SelectItem value="fill">{t("fillOption")}</SelectItem>
                                <SelectItem value="scale-down">{t("scaleDownOption")}</SelectItem>
                                <SelectItem value="none">{t("noneOption")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label htmlFor="alignment" className="block text-sm font-bold text-[#1A1A1A] mb-2">
                            {t("imageFocalPoint")}
                        </label>
                        <Select value={alignment} onValueChange={setAlignment} disabled={submitting || deleting}>
                            <SelectTrigger className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium bg-white">
                                <SelectValue placeholder={t("selectFocalPoint")} />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-[#E5E5E5] rounded-xl shadow-lg">
                                <SelectItem value="center">{t("center")}</SelectItem>
                                <SelectItem value="top">{t("top")}</SelectItem>
                                <SelectItem value="bottom">{t("bottom")}</SelectItem>
                                <SelectItem value="left">{t("left")}</SelectItem>
                                <SelectItem value="right">{t("right")}</SelectItem>
                                <SelectItem value="top left">{t("topLeft")}</SelectItem>
                                <SelectItem value="top right">{t("topRight")}</SelectItem>
                                <SelectItem value="bottom left">{t("bottomLeft")}</SelectItem>
                                <SelectItem value="bottom right">{t("bottomRight")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="order" className="block text-sm font-bold text-[#1A1A1A] mb-2">
                                {t("displayOrder")}
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
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
                                {t("status")}
                            </label>
                            <div className="flex items-center gap-3 h-[50px]">
                                <button
                                    type="button"
                                    onClick={() => setActive(!active)}
                                    disabled={submitting || deleting}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${active ? "bg-[#C8102E]" : "bg-[#A9A9A9]"}`}
                                >
                                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${active ? "translate-x-7" : "translate-x-1"}`} />
                                </button>
                                <span className="text-sm font-bold text-[#1A1A1A]">
                                    {active ? t("active") : t("inactive")}
                                </span>
                            </div>
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
                        {t("cancel")}
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-3 bg-[#C8102E] text-white font-bold rounded-xl hover:bg-[#A00D24] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={submitting || uploading || deleting || !imageUrl}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {t("savingChangesBtn")}
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                {t("saveChanges")}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
