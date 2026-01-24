"use client";

import { useState, useRef, DragEvent, ChangeEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import "./avatar-upload.css";

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

export default function AvatarUpload({
    currentAvatar,
    userId,
    onSuccess,
}: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentAvatar);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
        null
    );
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);
    const [imageError, setImageError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const onCropComplete = useCallback(
        (croppedArea: any, croppedAreaPixels: CropArea) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: CropArea
    ): Promise<string> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("No 2d context");
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return canvas.toDataURL("image/jpeg", 0.95);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFile(files[0]);
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            handleFile(files[0]);
        }
    };

    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            setMessage({ type: "error", text: "Please select an image file" });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: "error", text: "Image must be less than 5MB" });
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
            const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
            setPreview(croppedImage);
            setImageError(false);
            setShowCropModal(false);
            setSelectedImage(null);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        } catch (error) {
            console.error("Error cropping image:", error);
            setMessage({ type: "error", text: "Failed to crop image" });
        }
    };

    const handleCropCancel = () => {
        setShowCropModal(false);
        setSelectedImage(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleUpload = async () => {
        if (!preview || preview === currentAvatar) {
            setMessage({ type: "error", text: "No new image to upload" });
            return;
        }

        setIsUploading(true);
        setMessage(null);

        try {
            const response = await fetch("/api/profile/avatar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    image: preview,
                    type: "base64",
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: "success", text: "Avatar uploaded successfully!" });
                router.refresh();
                if (onSuccess) onSuccess();
            } else {
                setMessage({
                    type: "error",
                    text: data.error || "Failed to upload avatar",
                });
            }
        } catch (error) {
            console.error("Error uploading avatar:", error);
            setMessage({ type: "error", text: "Failed to upload avatar" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = async () => {
        if (!currentAvatar) {
            setMessage({ type: "error", text: "No avatar to remove" });
            return;
        }

        if (!confirm("Are you sure you want to remove your avatar?")) {
            return;
        }

        setIsUploading(true);
        setMessage(null);

        try {
            const response = await fetch("/api/profile/avatar", {
                method: "DELETE",
            });

            const data = await response.json();

            if (response.ok) {
                setPreview(null);
                setMessage({ type: "success", text: "Avatar removed successfully!" });
                router.refresh();
                if (onSuccess) onSuccess();
            } else {
                setMessage({
                    type: "error",
                    text: data.error || "Failed to remove avatar",
                });
            }
        } catch (error) {
            console.error("Error removing avatar:", error);
            setMessage({ type: "error", text: "Failed to remove avatar" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        setPreview(currentAvatar);
        setMessage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const getInitials = () => {
        return "U";
    };

    const hasChanges = preview !== currentAvatar;

    return (
        <>
            <div className="avatar-upload-container">
                <h3 className="avatar-upload-title">Profile Picture</h3>

                {message && (
                    <div className={`upload-message upload-message-${message.type}`}>
                        {message.type === "success" ? "✓" : "✕"} {message.text}
                    </div>
                )}

                <div className="avatar-upload-content">
                    <div className="upload-preview-section">
                        {preview && !imageError ? (
                            <img
                                src={preview}
                                alt="Avatar"
                                className="upload-preview-image"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="upload-preview-placeholder">
                                <span className="upload-preview-initials">{getInitials()}</span>
                            </div>
                        )}
                    </div>

                    <div
                        className={`avatar-dropzone ${isDragging ? "dragging" : ""}`}
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
                            className="avatar-file-input"
                        />

                        <svg
                            className="upload-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>

                        <p className="dropzone-text">
                            <span className="dropzone-highlight">Click to upload</span> or
                            drag and drop
                        </p>
                        <p className="dropzone-hint">PNG, JPG, GIF up to 5MB</p>
                    </div>
                </div>

                <div className="avatar-actions">
                    {hasChanges && (
                        <>
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isUploading}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="btn-primary"
                            >
                                {isUploading ? (
                                    <>
                                        <span className="upload-spinner"></span>
                                        Uploading...
                                    </>
                                ) : (
                                    "Upload Avatar"
                                )}
                            </button>
                        </>
                    )}

                    {currentAvatar && !hasChanges && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            disabled={isUploading}
                            className="btn-danger"
                        >
                            {isUploading ? (
                                <>
                                    <span className="upload-spinner"></span>
                                    Removing...
                                </>
                            ) : (
                                "Remove Avatar"
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Crop Modal */}
            {showCropModal && selectedImage && (
                <div className="crop-modal-overlay">
                    <div className="crop-modal">
                        <div className="crop-modal-header">
                            <h3>Crop Your Photo</h3>
                            <button
                                onClick={handleCropCancel}
                                className="crop-modal-close"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="crop-container">
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

                        <div className="crop-controls">
                            <label className="crop-control-label">
                                Zoom
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="crop-slider"
                                />
                            </label>
                        </div>

                        <div className="crop-modal-actions">
                            <button
                                onClick={handleCropCancel}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button onClick={handleCropSave} className="btn-primary">
                                Apply Crop
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
