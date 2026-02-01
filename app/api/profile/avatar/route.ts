import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const AvatarUploadSchema = z.object({
    image: z.string().min(1, "Image data is required"),
    type: z.enum(["url", "base64"]).default("base64"),
});

/**
 * POST /api/profile/avatar
 * Upload avatar image
 */
export async function POST(request: Request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const validation = AvatarUploadSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid input", details: validation.error.issues },
                { status: 400 }
            );
        }

        const { image, type } = validation.data;
        let avatarUrl: string;

        if (type === "url") {
            // If it's a URL, validate and use it directly
            try {
                new URL(image);
                avatarUrl = image;
            } catch {
                return NextResponse.json(
                    { error: "Invalid URL format" },
                    { status: 400 }
                );
            }
        } else {
            // Handle base64 image upload
            try {
                // Extract base64 data and mime type
                const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

                if (!matches || matches.length !== 3) {
                    return NextResponse.json(
                        { error: "Invalid base64 image format" },
                        { status: 400 }
                    );
                }

                const mimeType = matches[1];
                const base64Data = matches[2];

                // Validate image type
                const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
                if (!allowedTypes.includes(mimeType)) {
                    return NextResponse.json(
                        { error: "Invalid image type. Allowed: JPEG, PNG, GIF, WebP" },
                        { status: 400 }
                    );
                }

                // Get file extension
                const extension = mimeType.split("/")[1];
                const fileName = `${session.user.id}-${Date.now()}.${extension}`;

                // Create uploads directory if it doesn't exist
                const uploadsDir = join(process.cwd(), "public", "uploads", "avatars");
                if (!existsSync(uploadsDir)) {
                    await mkdir(uploadsDir, { recursive: true });
                }

                // Save file
                const filePath = join(uploadsDir, fileName);
                const buffer = Buffer.from(base64Data, "base64");

                // Validate file size (max 5MB)
                if (buffer.length > 5 * 1024 * 1024) {
                    return NextResponse.json(
                        { error: "Image too large. Maximum size is 5MB" },
                        { status: 400 }
                    );
                }

                await writeFile(filePath, buffer);

                // Generate public URL
                avatarUrl = `/uploads/avatars/${fileName}`;
            } catch (error) {
                console.error("Error processing image:", error);
                return NextResponse.json(
                    { error: "Failed to process image" },
                    { status: 500 }
                );
            }
        }

        // Update user avatar in database
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { avatar: avatarUrl },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
            },
        });

        return NextResponse.json({
            message: "Avatar uploaded successfully",
            user: updatedUser,
            avatarUrl,
        });
    } catch (error) {
        console.error("Error uploading avatar:", error);
        return NextResponse.json(
            { error: "Failed to upload avatar" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/profile/avatar
 * Remove avatar image
 */
export async function DELETE() {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { avatar: null },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
            },
        });

        return NextResponse.json({
            message: "Avatar removed successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error removing avatar:", error);
        return NextResponse.json(
            { error: "Failed to remove avatar" },
            { status: 500 }
        );
    }
}
