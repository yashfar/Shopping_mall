import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ messages });
}
