"use client";

import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import Cropper from "react-easy-crop";
import { Camera, UploadCloud, X } from "lucide-react";
import { Button } from "@@/components/ui/button";
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
import { cn } from "@@/lib/utils";

interface AvatarUploadProps {
    currentAvatar: string | null;
    onSuccess?: () => void;
}

interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export default function AvatarUpload({ currentAvatar, onSuccess }: AvatarUploadProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentAvatar);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const t = useTranslations("profile");

    useEffect(() => {
        setPreview(currentAvatar);
        setImageError(false);
    }, [currentAvatar]);

    const onCropComplete = useCallback((_: unknown, pixels: CropArea) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", reject);
            image.src = url;
        });

    const getCroppedImg = async (imageSrc: string, pixelCrop: CropArea): Promise<string> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("No 2d context");
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        context.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
        return canvas.toDataURL("image/jpeg", 0.95);
    };

    const handleDragOver = (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            setMessage({ type: "error", text: t("pleaseSelectImage") });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: "error", text: t("imageTooLarge") });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result as string);
            setShowCropModal(true);
            setMessage(null);
            setImageError(false);
        };
        reader.readAsDataURL(file);
    };

    const resetCrop = () => {
        setShowCropModal(false);
        setSelectedImage(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleCropSave = async () => {
        if (!selectedImage || !croppedAreaPixels) return;
        try {
            const cropped = await getCroppedImg(selectedImage, croppedAreaPixels);
            setPreview(cropped);
            setImageError(false);
            resetCrop();
        } catch {
            setMessage({ type: "error", text: t("failedToCrop") });
        }
    };

    const handleUpload = async () => {
        if (!preview || preview === currentAvatar) {
            setMessage({ type: "error", text: t("noNewImage") });
            return;
        }
        setIsUploading(true);
        setMessage(null);
        try {
            const response = await fetch("/api/profile/avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: preview, type: "base64" }),
            });
            const data = await response.json();
            if (response.ok) {
                setMessage({ type: "success", text: t("avatarUploadedSuccess") });
                router.refresh();
                onSuccess?.();
            } else {
                setMessage({ type: "error", text: data.error || t("failedToUploadAvatar") });
            }
        } catch {
            setMessage({ type: "error", text: t("failedToUploadAvatar") });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = async () => {
        setIsUploading(true);
        setMessage(null);
        try {
            const response = await fetch("/api/profile/avatar", { method: "DELETE" });
            const data = await response.json();
            if (response.ok) {
                setPreview(null);
                setMessage({ type: "success", text: t("avatarRemovedSuccess") });
                router.refresh();
                onSuccess?.();
            } else {
                setMessage({ type: "error", text: data.error || t("failedToRemoveAvatar") });
            }
        } catch {
            setMessage({ type: "error", text: t("failedToRemoveAvatar") });
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        setPreview(currentAvatar);
        setMessage(null);
        setImageError(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDialogOpenChange = (open: boolean) => {
        if (!open && !isUploading) {
            handleCancel();
        }
        setIsDialogOpen(open);
    };

    const hasChanges = preview !== currentAvatar;

    return (
        <Dialog.Root open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <Dialog.Trigger asChild>
                <button
                    type="button"
                    className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/45 bg-white/12 px-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:w-auto"
                >
                    <Camera className="h-4 w-4" strokeWidth={2} />
                    {t("changeProfilePhoto")}
                </button>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[22px] border border-[#eee8e2] bg-white shadow-2xl duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
                    <div className="flex items-start justify-between gap-4 border-b border-[#f0ebe6] px-5 py-4 sm:px-6">
                        <div>
                            <Dialog.Title className="text-lg font-bold text-slate-950">{t("profilePicture")}</Dialog.Title>
                            <Dialog.Description className="mt-1 text-sm text-slate-500">{t("profilePictureDescription")}</Dialog.Description>
                        </div>
                        <Dialog.Close asChild>
                            <button type="button" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25" aria-label={t("closeDialog")}>
                                <X className="h-5 w-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="overflow-y-auto p-5 sm:p-6">
                        {message && (
                            <div role="status" className={cn("mb-4 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium", message.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-red-100 bg-red-50 text-red-600")}>
                                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-black", message.type === "success" ? "bg-emerald-100" : "bg-red-100")}>
                                    {message.type === "success" ? "✓" : "!"}
                                </span>
                                {message.text}
                            </div>
                        )}

                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="sr-only" aria-label={t("clickToUpload")} />
                        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-stretch">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="group relative shrink-0 self-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" aria-label={t("clickToUpload")}>
                                {preview && !imageError ? (
                                    <NextImage src={preview} alt={t("profilePicture")} width={112} height={112} unoptimized className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg ring-1 ring-[#e8e2dc] transition group-hover:brightness-90" onError={() => setImageError(true)} />
                                ) : (
                                    <span className="flex h-28 w-28 items-center justify-center rounded-full bg-[#9b817d] text-3xl font-semibold text-white shadow-lg ring-4 ring-[#f2ece8]">U</span>
                                )}
                                <span className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-primary text-white shadow-md">
                                    <Camera className="h-4 w-4" />
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={cn(
                                    "flex min-h-36 w-full flex-1 flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-6 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                                    isDragging ? "border-primary bg-red-50" : "border-[#dcd3cb] bg-[#fbfaf8] hover:border-primary/60 hover:bg-red-50/40",
                                )}
                            >
                                <UploadCloud className="mb-2 h-7 w-7 text-primary" strokeWidth={1.8} />
                                <span className="text-sm font-semibold text-slate-800">{t("clickToUpload")}</span>
                                <span className="mt-1 text-xs text-slate-500">{t("dragAndDrop")}</span>
                                <span className="mt-2 text-xs text-slate-400">{t("uploadHint")}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-2 border-t border-[#f0ebe6] bg-[#fdfcfb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" disabled={!currentAvatar || isUploading || hasChanges} className="h-11 w-full rounded-xl border-[#e5ded7] font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-primary disabled:cursor-not-allowed sm:w-auto">
                                    {t("removeAvatar")}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl border-[#eee8e2]">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t("confirmRemoveAvatar")}</AlertDialogTitle>
                                    <AlertDialogDescription>{t("confirmRemoveAvatarDesc")}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("removeAvatar")}</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
                            {hasChanges && (
                                <>
                                    <Button variant="outline" onClick={handleCancel} disabled={isUploading} className="h-11 w-full rounded-xl border-[#e5ded7] font-semibold text-slate-600 hover:bg-[#f5f1ed] sm:w-auto">{t("cancel")}</Button>
                                    <Button onClick={handleUpload} disabled={isUploading} className="h-11 w-full gap-2 rounded-xl bg-primary px-5 font-semibold hover:bg-destructive sm:w-auto">
                                        {isUploading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                                        {isUploading ? t("uploading") : t("uploadAvatar")}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>

            <Dialog.Root open={showCropModal} onOpenChange={(open) => { if (!open) resetCrop(); }}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                    {selectedImage && (
                        <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] flex max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[22px] bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b border-[#f0ebe6] px-5 py-4">
                                <Dialog.Title className="text-base font-bold text-slate-950">{t("cropYourPhoto")}</Dialog.Title>
                                <Dialog.Close asChild>
                                    <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25" aria-label={t("closeDialog")}>
                                        <X className="h-5 w-5" />
                                    </button>
                                </Dialog.Close>
                            </div>
                            <Dialog.Description className="sr-only">{t("cropPhotoDescription")}</Dialog.Description>
                            <div className="relative h-64 w-full bg-black sm:h-80">
                                <Cropper image={selectedImage} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
                            </div>
                            <div className="border-y border-[#f0ebe6] px-5 py-4">
                                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                                    {t("zoom")}
                                    <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-primary" />
                                </label>
                            </div>
                            <div className="flex flex-col-reverse justify-end gap-2 px-5 py-4 sm:flex-row">
                                <Button variant="outline" onClick={resetCrop} className="h-11 w-full rounded-xl sm:w-auto">{t("cancel")}</Button>
                                <Button onClick={handleCropSave} className="h-11 w-full rounded-xl bg-primary hover:bg-destructive sm:w-auto">{t("applyCrop")}</Button>
                            </div>
                        </Dialog.Content>
                    )}
                </Dialog.Portal>
            </Dialog.Root>
        </Dialog.Root>
    );
}
