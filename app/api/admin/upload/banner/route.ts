import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

/**
 * POST /api/admin/upload/banner
 * Upload banner image (Admin only)
 */
export async function POST(req: Request) {
    const session = await auth();

    // Check authentication
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed" },
                { status: 400 }
            );
        }

        const uploadsDir = join(process.cwd(), "public", "banners");
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = file.name.split(".").pop();
        const fileName = `banner-${timestamp}-${randomString}.${extension}`;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = join(uploadsDir, fileName);
        await writeFile(filePath, buffer);

        const url = `/banners/${fileName}`;

        return NextResponse.json({
            message: "Banner uploaded successfully",
            url,
        });
    } catch (error) {
        console.error("Error uploading banner:", error);
        return NextResponse.json(
            { error: "Failed to upload banner" },
            { status: 500 }
        );
    }
}
