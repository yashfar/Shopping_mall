import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/address/[id]
 * Updates an existing address (owner validation required)
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const {
            title,
            firstName,
            lastName,
            phone,
            city,
            district,
            neighborhood,
            fullAddress,
        } = body;

        // Validate required fields
        if (
            !title ||
            !firstName ||
            !lastName ||
            !phone ||
            !city ||
            !district ||
            !neighborhood ||
            !fullAddress
        ) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        // Check if address exists and belongs to the user
        const existingAddress = await prisma.address.findUnique({
            where: { id },
        });

        if (!existingAddress) {
            return NextResponse.json(
                { error: "Address not found" },
                { status: 404 }
            );
        }

        if (existingAddress.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Forbidden: You don't own this address" },
                { status: 403 }
            );
        }

        // Update the address
        const updatedAddress = await prisma.address.update({
            where: { id },
            data: {
                title,
                firstName,
                lastName,
                phone,
                city,
                district,
                neighborhood,
                fullAddress,
            },
        });

        return NextResponse.json({ address: updatedAddress });
    } catch (error) {
        console.error("Error updating address:", error);
        return NextResponse.json(
            { error: "Failed to update address" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/address/[id]
 * Deletes an existing address (owner validation required)
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;

        // Check if address exists and belongs to the user
        const existingAddress = await prisma.address.findUnique({
            where: { id },
        });

        if (!existingAddress) {
            return NextResponse.json(
                { error: "Address not found" },
                { status: 404 }
            );
        }

        if (existingAddress.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Forbidden: You don't own this address" },
                { status: 403 }
            );
        }

        // Delete the address
        await prisma.address.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Address deleted successfully" });
    } catch (error) {
        console.error("Error deleting address:", error);
        return NextResponse.json(
            { error: "Failed to delete address" },
            { status: 500 }
        );
    }
}
