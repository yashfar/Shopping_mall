import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const banners = await prisma.banner.findMany({
            where: { active: true },
            orderBy: { order: "asc" },
        });

        const settings = await prisma.bannerSettings.findFirst();

        return NextResponse.json({
            banners,
            settings: settings || {
                animationSpeed: 500,
                slideDelay: 3000,
                animationType: "slide",
                loop: true
            }
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
    }
}
