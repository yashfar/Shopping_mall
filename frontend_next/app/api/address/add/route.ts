import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/address/add
 * Creates a new address for the authenticated user
 */
export async function POST(req: Request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
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

        // Create the address
        const address = await prisma.address.create({
            data: {
                userId: session.user.id,
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

        return NextResponse.json({ address }, { status: 201 });
    } catch (error) {
        console.error("Error creating address:", error);
        return NextResponse.json(
            { error: "Failed to create address" },
            { status: 500 }
        );
    }
}
