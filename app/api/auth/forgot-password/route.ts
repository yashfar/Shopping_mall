import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendResetPasswordEmail } from "@@/lib/mail";
import crypto from "crypto";

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 * 
 * Security: Always returns success to prevent email enumeration
 */
export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        // Validate email format
        if (!email || typeof email !== "string" || !email.includes("@")) {
            return NextResponse.json(
                { error: "Invalid email address" },
                { status: 400 }
            );
        }

        // Normalize email (lowercase, trim)
        const normalizedEmail = email.toLowerCase().trim();

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true, email: true },
        });

        // IMPORTANT: Always return success to prevent email enumeration
        // This prevents attackers from discovering which emails are registered

        if (user) {
            // Generate secure random token
            const token = crypto.randomUUID();

            // Token expires in 15 minutes
            const expires = new Date(Date.now() + 15 * 60 * 1000);

            // Delete any existing reset tokens for this user
            await prisma.verificationToken.deleteMany({
                where: { identifier: normalizedEmail },
            });

            // Create new reset token
            await prisma.verificationToken.create({
                data: {
                    identifier: normalizedEmail,
                    token,
                    expires,
                },
            });

            // Send reset email
            await sendResetPasswordEmail(normalizedEmail, token);
        }

        // Always return success (even if user doesn't exist)
        return NextResponse.json({
            message:
                "If an account exists with that email, you will receive a password reset link shortly.",
        });
    } catch (error) {
        console.error("Error in forgot-password:", error);
        return NextResponse.json(
            { error: "An error occurred. Please try again later." },
            { status: 500 }
        );
    }
}
