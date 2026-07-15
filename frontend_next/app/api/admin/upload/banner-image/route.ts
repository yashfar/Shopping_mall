import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { uploadBannerImage } from "@@/lib/upload-banner";

/**
 * POST /api/admin/upload/banner-image
 * Upload banner images (Admin only)
 * Supports both development (local) and production (Vercel Blob)
 */
export async function POST(req: Request) {
    const session = await auth();

    // Check authentication
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== "ADMIN") {
        return NextResponse.json(
            { error: "Forbidden: Admin access required" },
            { status: 403 }
        );
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Use unified upload utility
        const result = await uploadBannerImage(file);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to upload image" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            message: "Banner image uploaded successfully",
            url: result.url,
        });
    } catch (error) {
        console.error("Error uploading banner image:", error);
        return NextResponse.json(
            { error: "Failed to upload image" },
            { status: 500 }
        );
    }
}
