import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { PasswordSchema } from "@@/lib/auth/dto";
import { requireAuth } from "@@/lib/auth/rbac";
import { z } from "zod";

const SetPasswordSchema = z.object({
    newPassword: PasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
});

export async function POST(req: Request) {
    const { session, response } = await requireAuth();
    if (!session) return response;

    try {
        const body = await req.json();
        const result = SetPasswordSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            );
        }

        const { newPassword, confirmPassword } = result.data;

        if (newPassword !== confirmPassword) {
            return NextResponse.json(
                { error: "Passwords do not match" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { password: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.password) {
            return NextResponse.json(
                { error: "Password already set. Use change password instead." },
                { status: 400 }
            );
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashed },
        });

        return NextResponse.json({ message: "Password set successfully." });
    } catch (error) {
        console.error("Error in set-password:", error);
        return NextResponse.json(
            { error: "An error occurred. Please try again." },
            { status: 500 }
        );
    }
}
