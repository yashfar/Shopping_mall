import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/admin/users/[id]
 * Deletes a user (admin only)
 */
export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();

    // Check authentication
    if (!session) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check admin role
    if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
        return NextResponse.json(
            { error: "Cannot delete your own account" },
            { status: 400 }
        );
    }

    try {
        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ message: "User deleted" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/users/[id]
 * Updates user role (admin only)
 */
export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await auth();

    // Check authentication
    if (!session) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check admin role
    if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const { role } = await req.json();

    // Validate role
    if (role !== "USER" && role !== "ADMIN") {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}
