import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const faqs = await prisma.faq.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(faqs);
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { question, questionEn, answer, answerEn, order, isActive } = await req.json();

        if (!question?.trim() || !answer?.trim()) {
            return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });
        }

        const faq = await prisma.faq.create({
            data: {
                question: question.trim(),
                questionEn: questionEn?.trim() || null,
                answer: answer.trim(),
                answerEn: answerEn?.trim() || null,
                order: order ?? 0,
                isActive: isActive ?? true,
            },
        });

        return NextResponse.json(faq, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 });
    }
}
