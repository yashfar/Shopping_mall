import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { deleteBannerImage } from "@@/lib/upload-banner";

/**
 * DELETE /api/admin/banners/[id]/delete
 * Delete a banner and its associated image file
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    // Validate admin permissions
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json(
            { error: "Unauthorized: Admin access required" },
            { status: 401 }
        );
    }

    const { id } = await params;

    try {
        // First, fetch the banner to get the image URL
        const banner = await prisma.banner.findUnique({
            where: { id },
        });

        if (!banner) {
            return NextResponse.json(
                { error: "Banner not found" },
                { status: 404 }
            );
        }

        // Delete the banner from database
        await prisma.banner.delete({
            where: { id },
        });

        // Delete the image file using unified utility
        // This handles both local files and Vercel Blob
        try {
            await deleteBannerImage(banner.imageUrl);
        } catch (fileError) {
            // Log error but don't fail the request
            // The database record is already deleted
            console.error("Error deleting image file:", fileError);
        }

        return NextResponse.json({
            message: "Banner deleted successfully",
            deletedBanner: {
                id: banner.id,
                imageUrl: banner.imageUrl,
            },
        });
    } catch (error) {
        console.error("Error deleting banner:", error);

        // Handle specific Prisma errors
        if (error instanceof Error) {
            if (error.message.includes("Record to delete does not exist")) {
                return NextResponse.json(
                    { error: "Banner not found" },
                    { status: 404 }
                );
            }
        }

        return NextResponse.json(
            { error: "Failed to delete banner. Please try again." },
            { status: 500 }
        );
    }
}
