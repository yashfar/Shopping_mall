import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const returns = await prisma.returnRequest.findMany({
        include: {
            order: {
                include: {
                    user: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                    items: {
                        include: {
                            product: { select: { id: true, title: true, thumbnail: true } },
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ returns });
}
