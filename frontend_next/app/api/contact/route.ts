import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendContactFormEmail } from "@@/lib/mail";

export async function POST(req: Request) {
    try {
        const { name, email, subject, message } = await req.json();

        if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        // Save to DB
        await prisma.contactMessage.create({
            data: {
                name: name.trim(),
                email: email.trim(),
                subject: subject.trim(),
                message: message.trim(),
            },
        });

        // Send email to admin (non-blocking)
        try {
            await sendContactFormEmail({
                name: name.trim(),
                email: email.trim(),
                subject: subject.trim(),
                message: message.trim(),
            });
        } catch (emailErr) {
            console.error("Failed to send contact email:", emailErr);
        }

        return NextResponse.json({ message: "Message sent successfully" }, { status: 201 });
    } catch (error) {
        console.error("Error saving contact message:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
