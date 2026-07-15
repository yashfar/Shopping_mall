"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
    const t = useTranslations("adminBanners");
    const [imageUrl, setImageUrl] = useState("");
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

    // Delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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
            setImagePreview("");
        } finally {
            setUploading(false);
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
                    toast.warning(t("imageRemovedStorageFailed"));
                } else {
                    toast.success(t("imageRemoved"));
                }
            } else {
                toast.success(t("imageRemoved"));
            }

            setImageUrl("");
            setImagePath("");
            setImagePreview("");
            setShowDeleteConfirm(false);

        } catch (error: any) {
            console.error(error);
            toast.error(t("failedToRemoveImage"));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRemoveRequest = () => {
        setShowDeleteConfirm(true);
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
            const response = await fetch("/api/admin/banners", {
                method: "POST",
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
                throw new Error(data.error || t("failedToCreateBanner"));
            }

            toast.success(t("bannerCreated"));
            setTimeout(() => {
                router.push("/admin/banners");
            }, 1500);
        } catch (err: any) {
            toast.error(err.message || t("failedToCreateBanner"));
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
                    {t("back")}
                </button>
                <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">
                    {t("addNewBanner")}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
                        {t("bannerImage")}
                    </h2>
                    <p className="text-[#A9A9A9] mb-6">
                        {t("bannerImageDesc")}
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
                                    {uploading ? t("uploading") : t("clickToUpload")}
                                </span>
                                <span className="text-sm text-[#A9A9A9]">
                                    {t("imageHint")}
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
                                {t("removeImage")}
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">
                        {t("bannerDetails")}
                    </h2>

                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
                            {t("titleLabel")} <span className="text-[#A9A9A9] font-normal">{t("optional")}</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium"
                            placeholder={t("titlePlaceholder")}
                            disabled={submitting}
                            maxLength={200}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
                            {t("subtitleLabel")} <span className="text-[#A9A9A9] font-normal">{t("optional")}</span>
                        </label>
                        <input
                            type="text"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-[#E5E5E5] rounded-xl focus:border-[#C8102E] focus:outline-none transition-colors font-medium"
                            placeholder={t("subtitlePlaceholder")}
                            disabled={submitting}
                            maxLength={200}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
                            {t("imageResizeMode")}
                        </label>
                        <Select value={displayMode} onValueChange={setDisplayMode} disabled={submitting}>
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
                        <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
                            {t("imageFocalPoint")}
                        </label>
                        <Select value={alignment} onValueChange={setAlignment} disabled={submitting}>
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

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-[#1A1A1A] mb-2">
                                {t("displayOrder")}
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
                                {t("status")}
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
                                    {active ? t("active") : t("inactive")}
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
                        {t("cancel")}
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-3 bg-[#C8102E] text-white font-bold rounded-xl hover:bg-[#A00D24] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={submitting || uploading || !imageUrl}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {t("creatingBanner")}
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                {t("createBanner")}
                            </>
                        )}
                    </button>
                </div>
            </form>

            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("removeImageDialogTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("removeImageDialogDesc")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmRemoveImage();
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
