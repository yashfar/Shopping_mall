import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const AvatarUploadSchema = z.object({
    image: z.string().min(1, "Image data is required"),
    type: z.enum(["url", "base64"]).default("base64"),
});

// Helper to extract path from Supabase URL
function getPathFromUrl(url: string) {
    try {
        const parts = url.split('/public/products/'); // Assuming 'products' is the bucket name in public URL
        if (parts.length > 1) {
            return parts[1];
        }
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * POST /api/profile/avatar
 * Upload avatar image to Supabase Storage
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
                const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

                if (!matches || matches.length !== 3) {
                    return NextResponse.json(
                        { error: "Invalid base64 image format" },
                        { status: 400 }
                    );
                }

                const mimeType = matches[1];
                const base64Data = matches[2];

                const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
                if (!allowedTypes.includes(mimeType)) {
                    return NextResponse.json(
                        { error: "Invalid image type. Allowed: JPEG, PNG, GIF, WebP" },
                        { status: 400 }
                    );
                }

                const extension = mimeType.split("/")[1];
                const fileName = `${session.user.id}-${Date.now()}.${extension}`;
                const bucket = process.env.SUPABASE_BUCKET || 'products';
                const path = `avatars/${fileName}`;

                const buffer = Buffer.from(base64Data, "base64");

                if (buffer.length > 5 * 1024 * 1024) {
                    return NextResponse.json(
                        { error: "Image too large. Maximum size is 5MB" },
                        { status: 400 }
                    );
                }

                // Upload to Supabase using Admin client
                const { error: uploadError } = await supabaseAdmin.storage
                    .from(bucket)
                    .upload(path, buffer, {
                        contentType: mimeType,
                        upsert: true
                    });

                if (uploadError) {
                    console.error('Supabase upload error:', uploadError);
                    if (uploadError.message.includes("row-level security policy")) {
                        return NextResponse.json({ error: "Storage permission denied (RLS)." }, { status: 500 });
                    }
                    throw new Error(uploadError.message);
                }

                // Get Public URL
                const { data: { publicUrl } } = supabaseAdmin.storage
                    .from(bucket)
                    .getPublicUrl(path);

                avatarUrl = publicUrl;

            } catch (error) {
                console.error("Error processing image:", error);
                return NextResponse.json(
                    { error: "Failed to process image upload" },
                    { status: 500 }
                );
            }
        }

        // Get old avatar to delete if it exists and is a Supabase URL
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { avatar: true }
        });

        if (currentUser?.avatar && currentUser.avatar.includes("supabase.co")) {
            const bucket = process.env.SUPABASE_BUCKET || 'products';
            // Try to clean up old avatar
            const oldPath = getPathFromUrl(currentUser.avatar);
            if (oldPath) {
                await supabaseAdmin.storage.from(bucket).remove([oldPath]).catch(console.error);
            }
        }

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
        // Get current avatar for cleanup
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { avatar: true }
        });

        if (currentUser?.avatar && currentUser.avatar.includes("supabase.co")) {
            const bucket = process.env.SUPABASE_BUCKET || 'products';
            const oldPath = getPathFromUrl(currentUser.avatar);
            if (oldPath) {
                await supabaseAdmin.storage.from(bucket).remove([oldPath]).catch(console.error);
            }
        }

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
