import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

/**
 * POST /api/auth/reset-password
 * Reset password using valid token
 * 
 * Security:
 * - Token must be valid and not expired
 * - Token is single-use (deleted after successful reset)
 * - Password is hashed with bcrypt
 */
export async function POST(req: Request) {
    try {
        const { token, newPassword } = await req.json();

        // Validate inputs
        if (!token || typeof token !== "string") {
            return NextResponse.json({ error: "Invalid token" }, { status: 400 });
        }

        if (!newPassword || typeof newPassword !== "string") {
            return NextResponse.json(
                { error: "Password is required" },
                { status: 400 }
            );
        }

        // Validate password strength
        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters long" },
                { status: 400 }
            );
        }

        // Find valid token
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!verificationToken) {
            return NextResponse.json(
                { error: "Invalid or expired reset link" },
                { status: 400 }
            );
        }

        // Check if token is expired
        if (verificationToken.expires < new Date()) {
            // Delete expired token
            await prisma.verificationToken.delete({
                where: { token },
            });

            return NextResponse.json(
                { error: "Reset link has expired. Please request a new one." },
                { status: 400 }
            );
        }

        // Find user by email (identifier)
        const user = await prisma.user.findUnique({
            where: { email: verificationToken.identifier },
            select: { id: true, email: true },
        });

        if (!user) {
            // Delete token if user doesn't exist
            await prisma.verificationToken.delete({
                where: { token },
            });

            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password and delete token in a transaction
        await prisma.$transaction([
            // Update password
            prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
            }),
            // Delete used token (single-use)
            prisma.verificationToken.delete({
                where: { token },
            }),
        ]);

        return NextResponse.json({
            message: "Password reset successful. You can now log in with your new password.",
        });
    } catch (error) {
        console.error("Error in reset-password:", error);
        return NextResponse.json(
            { error: "An error occurred. Please try again later." },
            { status: 500 }
        );
    }
}
