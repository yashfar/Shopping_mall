"use client";

import { useState, useRef, DragEvent, ChangeEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import NextImage from "next/image";
import Cropper from "react-easy-crop";
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
    userId: string;
    onSuccess?: () => void;
}

interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export default function AvatarUpload({ currentAvatar, userId: _userId, onSuccess }: AvatarUploadProps) {
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
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No 2d context");
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
        return canvas.toDataURL("image/jpeg", 0.95);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };
    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
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

    const handleCropSave = async () => {
        if (!selectedImage || !croppedAreaPixels) return;
        try {
            const cropped = await getCroppedImg(selectedImage, croppedAreaPixels);
            setPreview(cropped);
            setImageError(false);
            setShowCropModal(false);
            setSelectedImage(null);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        } catch {
            setMessage({ type: "error", text: t("failedToCrop") });
        }
    };

    const handleCropCancel = () => {
        setShowCropModal(false);
        setSelectedImage(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        if (fileInputRef.current) fileInputRef.current.value = "";
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
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const hasChanges = preview !== currentAvatar;

    return (
        <>
            <div className="bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-100/50 p-6 sm:p-8">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">{t("profilePicture")}</h3>

                {message && (
                    <div className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl mb-4 text-sm font-medium border animate-in fade-in slide-in-from-top-2",
                        message.type === "success"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-red-50 text-red-600 border-red-100"
                    )}>
                        <span className={cn(
                            "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black",
                            message.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                        )}>
                            {message.type === "success" ? "✓" : "!"}
                        </span>
                        {message.text}
                    </div>
                )}

                {/* Upload Area */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Preview — clickable */}
                        <div
                            className="shrink-0 cursor-pointer group relative"
                            onClick={() => fileInputRef.current?.click()}
                            title={t("clickToUpload")}
                        >
                            {preview && !imageError ? (
                                <NextImage
                                    src={preview}
                                    alt="Avatar"
                                    width={96}
                                    height={96}
                                    unoptimized
                                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 group-hover:opacity-80 transition-opacity"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-linear-to-br from-red-400 to-rose-700 flex items-center justify-center border-2 border-gray-200 group-hover:opacity-80 transition-opacity">
                                    <span className="text-3xl font-bold text-white drop-shadow">U</span>
                                </div>
                            )}
                            {/* Camera overlay */}
                            <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Dropzone — no shadcn equivalent, raw HTML */}
                        <div
                            className={cn(
                                "flex-1 w-full border-2 border-dashed rounded-xl py-5 px-4 text-center cursor-pointer transition-all",
                                isDragging
                                    ? "border-primary bg-red-50"
                                    : "border-gray-200 bg-white hover:border-primary hover:bg-red-50/40"
                            )}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm text-gray-500">
                                <span className="font-bold text-primary">{t("clickToUpload")}</span>{" "}
                                {t("dragAndDrop")}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{t("uploadHint")}</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-3">
                    {/* Remove — always visible, disabled when no avatar */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                disabled={!currentAvatar || isUploading || hasChanges}
                                className="w-full sm:w-auto rounded-xl font-bold border-gray-200 text-gray-500 hover:border-destructive hover:text-destructive hover:bg-red-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
                            >
                                {t("removeAvatar")}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t("confirmRemoveAvatar")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t("confirmRemoveAvatarDesc") ?? "Bu işlem geri alınamaz."}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleRemove}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                                >
                                    {t("removeAvatar")}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Save / Cancel pending changes */}
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                        {hasChanges && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={isUploading}
                                    className="w-full sm:w-auto rounded-xl font-bold border-gray-200 text-gray-600 hover:bg-gray-100 cursor-pointer"
                                >
                                    {t("cancel")}
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="w-full sm:w-auto rounded-xl font-bold bg-primary hover:bg-destructive shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                            {t("uploading")}
                                        </>
                                    ) : (
                                        t("uploadAvatar")
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Crop Modal — no shadcn Dialog available, raw overlay */}
            {showCropModal && selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
                    <div className="bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-100/50 w-full max-w-lg max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 className="text-base font-semibold text-foreground">{t("cropYourPhoto")}</h3>
                            <button
                                onClick={handleCropCancel}
                                className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none p-1"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Cropper */}
                        <div className="relative w-full h-64 sm:h-80 bg-black">
                            <Cropper
                                image={selectedImage}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>

                        {/* Zoom */}
                        <div className="px-5 py-4 border-t border-b border-gray-100">
                            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                                {t("zoom")}
                                {/* raw input[range] — no shadcn Slider available */}
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-1.5 rounded-full appearance-none bg-border accent-primary cursor-pointer"
                                />
                            </label>
                        </div>

                        {/* Footer */}
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 px-5 py-4">
                            <Button variant="outline" onClick={handleCropCancel} className="w-full sm:w-auto">
                                {t("cancel")}
                            </Button>
                            <Button onClick={handleCropSave} className="w-full sm:w-auto">
                                {t("applyCrop")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
