import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();

        // Ensure strictly only ADMIN can see this
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ count: 0 }, { status: 403 });
        }

        const count = await prisma.order.count({
            where: {
                status: "PAID"
            }
        });

        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error fetching order count:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
