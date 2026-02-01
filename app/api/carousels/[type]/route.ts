import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

// Helper to ensure carousel exists
async function getOrCreateCarousel(type: string) {
    let carousel = await prisma.featuredCarousel.findUnique({
        where: { type },
        include: {
            items: {
                include: { product: true },
                orderBy: { order: "asc" },
            },
        },
    });

    if (!carousel) {
        carousel = await prisma.featuredCarousel.create({
            data: { type },
            include: {
                items: {
                    include: { product: true },
                    orderBy: { order: "asc" },
                },
            },
        });
    }

    return carousel;
}

export async function GET(
    req: Request,
    props: { params: Promise<{ type: string }> }
) {
    const params = await props.params;
    const { type } = params;

    // Allow public access for reading? Requirements say "On / (home page), fetch..."
    // So GET should be public.

    if (type !== "best-seller" && type !== "new-products") {
        return NextResponse.json({ error: "Invalid carousel type" }, { status: 400 });
    }

    try {
        const carousel = await getOrCreateCarousel(type);
        return NextResponse.json(carousel);
    } catch (error) {
        console.error("Error fetching carousel:", error);
        return NextResponse.json({ error: "Failed to fetch carousel" }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    props: { params: Promise<{ type: string }> }
) {
    const params = await props.params;
    const { type } = params;

    // Auth check
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (type !== "best-seller" && type !== "new-products") {
        return NextResponse.json({ error: "Invalid carousel type" }, { status: 400 });
    }

    try {
        const body = await req.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        const carousel = await getOrCreateCarousel(type);

        // Validation: Max 12 items
        if (carousel.items.length >= 12) {
            return NextResponse.json({ error: "Carousel cannot have more than 12 items" }, { status: 400 });
        }

        // Validation: Unique product
        const exists = carousel.items.find((item) => item.productId === productId);
        if (exists) {
            return NextResponse.json({ error: "Product already in carousel" }, { status: 400 });
        }

        // Add item
        const newItem = await prisma.carouselItem.create({
            data: {
                carouselId: carousel.id,
                productId,
                order: carousel.items.length, // Append to end
            },
            include: { product: true },
        });

        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
        console.error("Error adding item to carousel:", error);
        return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    props: { params: Promise<{ type: string }> }
) {
    const params = await props.params;
    const { type } = params;

    // Auth check
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { items } = body; // Expect array of { id: string, order: number }

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: "Invalid items format" }, { status: 400 });
        }

        // Transaction to update orders
        await prisma.$transaction(
            items.map((item: { id: string; order: number }) =>
                prisma.carouselItem.update({
                    where: { id: item.id },
                    data: { order: item.order },
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating carousel order:", error);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    props: { params: Promise<{ type: string }> }
) {
    const params = await props.params;
    // Auth check
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
        return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    try {
        await prisma.carouselItem.delete({
            where: { id: itemId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing item from carousel:", error);
        return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
    }
}
