import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateProfileSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    avatar: z.string().url().optional().nullable(),
});

/**
 * GET /api/profile
 * Get current user's profile
 */
export async function GET() {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                image: true,
                role: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/profile
 * Update current user's profile
 */
export async function PATCH(request: Request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const validation = UpdateProfileSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid input", details: validation.error.errors },
                { status: 400 }
            );
        }

        const { firstName, lastName, avatar } = validation.data;

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                firstName,
                lastName,
                avatar: avatar || null,
            },
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
            message: "Profile updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
