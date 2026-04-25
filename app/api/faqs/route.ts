import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const faqs = await prisma.faq.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: {
            id: true,
            question: true,
            questionEn: true,
            answer: true,
            answerEn: true,
        },
    });

    return NextResponse.json(faqs);
}
