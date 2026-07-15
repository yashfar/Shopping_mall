import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

/**
 * Unified image upload utility for banners
 * Handles both development (local filesystem) and production (Vercel Blob)
 */

interface UploadResult {
    url: string;
    success: boolean;
    error?: string;
}

/**
 * Upload banner image to appropriate storage
 * @param file - File object from FormData
 * @returns Promise with upload result containing URL
 */
export async function uploadBannerImage(file: File): Promise<UploadResult> {
    try {
        // Validate file
        const validation = validateBannerImage(file);
        if (!validation.valid) {
            return {
                url: "",
                success: false,
                error: validation.error,
            };
        }

        // Check if we're in production with Vercel Blob
        const isProduction = process.env.NODE_ENV === "production";
        const hasVercelBlob = process.env.BLOB_READ_WRITE_TOKEN;

        if (isProduction && hasVercelBlob) {
            // Production: Use Vercel Blob
            return await uploadToVercelBlob(file);
        } else {
            // Development: Use local filesystem
            return await uploadToLocalFileSystem(file);
        }
    } catch (error) {
        console.error("Error in uploadBannerImage:", error);
        return {
            url: "",
            success: false,
            error: "Failed to upload image",
        };
    }
}

/**
 * Validate banner image file
 */
function validateBannerImage(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: "Invalid file type. Only JPEG, PNG, and WebP are allowed",
        };
    }

    // Check file size (max 10MB for banners)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return {
            valid: false,
            error: "File too large. Maximum size is 10MB",
        };
    }

    // Check filename
    if (!file.name || file.name.length === 0) {
        return {
            valid: false,
            error: "Invalid filename",
        };
    }

    return { valid: true };
}

/**
 * Upload to local filesystem (development)
 */
async function uploadToLocalFileSystem(file: File): Promise<UploadResult> {
    try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), "public", "uploads", "banners");
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const fileName = generateUniqueFileName(file.name);

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = join(uploadsDir, fileName);
        await writeFile(filePath, buffer);

        // Return the public URL
        const url = `/uploads/banners/${fileName}`;

        console.log(`✅ Banner uploaded to local filesystem: ${url}`);

        return {
            url,
            success: true,
        };
    } catch (error) {
        console.error("Error uploading to local filesystem:", error);
        return {
            url: "",
            success: false,
            error: "Failed to save file to local storage",
        };
    }
}

/**
 * Upload to Vercel Blob (production)
 */
async function uploadToVercelBlob(file: File): Promise<UploadResult> {
    try {
        // Dynamically import Vercel Blob (only in production)
        const { put } = await import("@vercel/blob");

        // Generate unique filename
        const fileName = generateUniqueFileName(file.name);

        // Upload to Vercel Blob
        const blob = await put(`banners/${fileName}`, file, {
            access: "public",
            addRandomSuffix: false,
        });

        console.log(`✅ Banner uploaded to Vercel Blob: ${blob.url}`);

        return {
            url: blob.url,
            success: true,
        };
    } catch (error) {
        console.error("Error uploading to Vercel Blob:", error);
        return {
            url: "",
            success: false,
            error: "Failed to upload to cloud storage",
        };
    }
}

/**
 * Generate unique filename with timestamp and random string
 */
function generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split(".").pop() || "jpg";
    return `banner-${timestamp}-${randomString}.${extension}`;
}

/**
 * Delete banner image from storage
 * @param imageUrl - URL of the image to delete
 */
export async function deleteBannerImage(imageUrl: string): Promise<boolean> {
    try {
        // Check if it's a local file
        if (imageUrl.startsWith("/uploads/")) {
            // Local filesystem
            const filePath = join(process.cwd(), "public", imageUrl);
            if (existsSync(filePath)) {
                const { unlink } = await import("fs/promises");
                await unlink(filePath);
                console.log(`✅ Deleted local banner: ${imageUrl}`);
                return true;
            }
        } else if (imageUrl.startsWith("https://")) {
            // Vercel Blob
            try {
                const { del } = await import("@vercel/blob");
                await del(imageUrl);
                console.log(`✅ Deleted Vercel Blob banner: ${imageUrl}`);
                return true;
            } catch (error) {
                console.error("Error deleting from Vercel Blob:", error);
                return false;
            }
        }

        return false;
    } catch (error) {
        console.error("Error deleting banner image:", error);
        return false;
    }
}
