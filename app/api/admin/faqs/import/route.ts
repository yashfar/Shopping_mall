import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ",") {
                result.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
    }
    result.push(current.trim());
    return result;
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim());

        if (lines.length < 2) {
            return NextResponse.json({ error: "File is empty or missing data rows" }, { status: 400 });
        }

        // Skip header row
        const dataLines = lines.slice(1);
        const faqs: { question: string; questionEn?: string; answer: string; answerEn?: string; order: number }[] = [];
        const errors: string[] = [];

        dataLines.forEach((line, i) => {
            const cols = parseCSVLine(line);
            // Columns: question, questionEn, answer, answerEn, order
            const [question, questionEn, answer, answerEn, orderRaw] = cols;

            if (!question?.trim() || !answer?.trim()) {
                errors.push(`Row ${i + 2}: question and answer are required`);
                return;
            }

            faqs.push({
                question: question.trim(),
                questionEn: questionEn?.trim() || undefined,
                answer: answer.trim(),
                answerEn: answerEn?.trim() || undefined,
                order: parseInt(orderRaw ?? "") || 0,
            });
        });

        if (faqs.length === 0) {
            return NextResponse.json({ error: "No valid rows found", errors }, { status: 400 });
        }

        const created = await prisma.$transaction(
            faqs.map((faq) => prisma.faq.create({ data: { ...faq, isActive: true } }))
        );

        return NextResponse.json({ imported: created.length, errors });
    } catch {
        return NextResponse.json({ error: "Failed to import FAQs" }, { status: 500 });
    }
}
