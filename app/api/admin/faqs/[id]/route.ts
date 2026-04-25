import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const { question, questionEn, answer, answerEn, order, isActive } = await req.json();

        const faq = await prisma.faq.update({
            where: { id },
            data: {
                ...(question !== undefined && { question: question.trim() }),
                ...(questionEn !== undefined && { questionEn: questionEn?.trim() || null }),
                ...(answer !== undefined && { answer: answer.trim() }),
                ...(answerEn !== undefined && { answerEn: answerEn?.trim() || null }),
                ...(order !== undefined && { order }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json(faq);
    } catch {
        return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { id } = await params;
        await prisma.faq.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to delete FAQ" }, { status: 500 });
    }
}
