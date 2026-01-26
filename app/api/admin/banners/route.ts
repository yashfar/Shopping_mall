import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

// GET /api/admin/banners - List all banners
export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const banners = await prisma.banner.findMany({
            orderBy: { order: "asc" },
        });
        return NextResponse.json(banners);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
    }
}

// POST /api/admin/banners - Create new banner
export async function POST(req: Request) {
    const session = await auth();

    // Validate admin permissions
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json(
            { error: "Unauthorized: Admin access required" },
            { status: 401 }
        );
    }

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

        // Validate imageUrl format (must start with / or http)
        if (!imageUrl.startsWith("/") && !imageUrl.startsWith("http")) {
            return NextResponse.json(
                { error: "Invalid image URL format" },
                { status: 400 }
            );
        }

        // Validate order is a valid number
        const orderNumber = parseInt(order);
        if (isNaN(orderNumber) || orderNumber < 0) {
            return NextResponse.json(
                { error: "Order must be a valid number greater than or equal to 0" },
                { status: 400 }
            );
        }

        // Validate title length if provided
        if (title && typeof title === "string" && title.length > 200) {
            return NextResponse.json(
                { error: "Title must be 200 characters or less" },
                { status: 400 }
            );
        }

        // Validate subtitle length if provided
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

        // Create banner in database
        const banner = await prisma.banner.create({
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

        return NextResponse.json(
            {
                message: "Banner created successfully",
                banner,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating banner:", error);

        // Handle Prisma-specific errors
        if (error instanceof Error) {
            // Check for unique constraint violations or other DB errors
            if (error.message.includes("Unique constraint")) {
                return NextResponse.json(
                    { error: "A banner with this data already exists" },
                    { status: 409 }
                );
            }
        }

        return NextResponse.json(
            { error: "Failed to create banner. Please try again." },
            { status: 500 }
        );
    }
}
