import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const banner = await prisma.banner.findUnique({
            where: { id },
        });
        if (!banner) return NextResponse.json({ error: "Banner not found" }, { status: 404 });
        return NextResponse.json(banner);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch banner" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json(
            { error: "Unauthorized: Admin access required" },
            { status: 401 }
        );
    }

    const { id } = await params;

    try {
        const body = await req.json();
        const { imageUrl, title, subtitle, active, order, displayMode, alignment } = body;

        // Validate required fields
        if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
            return NextResponse.json(
                { error: "Image URL is required and must be a valid string" },
                { status: 400 }
            );
        }

        // Validate imageUrl format
        if (!imageUrl.startsWith("/") && !imageUrl.startsWith("http")) {
            return NextResponse.json(
                { error: "Invalid image URL format" },
                { status: 400 }
            );
        }

        // Validate order
        const orderNumber = parseInt(order);
        if (isNaN(orderNumber) || orderNumber < 0) {
            return NextResponse.json(
                { error: "Order must be a valid number greater than or equal to 0" },
                { status: 400 }
            );
        }

        // Validate title length
        if (title && typeof title === "string" && title.length > 200) {
            return NextResponse.json(
                { error: "Title must be 200 characters or less" },
                { status: 400 }
            );
        }

        // Validate subtitle length
        if (subtitle && typeof subtitle === "string" && subtitle.length > 200) {
            return NextResponse.json(
                { error: "Subtitle must be 200 characters or less" },
                { status: 400 }
            );
        }

        // Validate active is boolean
        const isActive = active === true || active === false ? active : true;

        // Validate displayMode
        const validDisplayModes = ["cover", "contain", "fill", "scale-down", "none"];
        const validatedDisplayMode = displayMode && validDisplayModes.includes(displayMode)
            ? displayMode
            : "cover";

        // Validate alignment
        const validAlignments = ["center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"];
        const validatedAlignment = alignment && validAlignments.includes(alignment)
            ? alignment
            : "center";

        // Update banner
        const banner = await prisma.banner.update({
            where: { id },
            data: {
                imageUrl: imageUrl.trim(),
                title: title && typeof title === "string" ? title.trim() || null : null,
                subtitle: subtitle && typeof subtitle === "string" ? subtitle.trim() || null : null,
                active: isActive,
                order: orderNumber,
                displayMode: validatedDisplayMode,
                alignment: validatedAlignment,
            },
        });

        return NextResponse.json({
            message: "Banner updated successfully",
            banner,
        });
    } catch (error) {
        console.error("Error updating banner:", error);

        if (error instanceof Error && error.message.includes("Record to update not found")) {
            return NextResponse.json(
                { error: "Banner not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: "Failed to update banner. Please try again." },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        await prisma.banner.delete({
            where: { id },
        });
        return NextResponse.json({ message: "Banner deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
    }
}
