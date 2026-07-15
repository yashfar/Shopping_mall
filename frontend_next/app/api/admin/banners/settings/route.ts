import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        let settings = await prisma.bannerSettings.findFirst();
        if (!settings) {
            settings = await prisma.bannerSettings.create({
                data: {
                    animationSpeed: 500,
                    slideDelay: 3000,
                    animationType: "slide",
                    loop: true,
                    arrowDisplay: "hover",
                }
            });
        }
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json(
            { error: "Unauthorized: Admin access required" },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { animationSpeed, slideDelay, animationType, loop, arrowDisplay } = body;

        // Validate animationSpeed
        const speed = parseInt(animationSpeed);
        if (isNaN(speed) || speed < 100 || speed > 5000) {
            return NextResponse.json(
                { error: "Animation speed must be between 100 and 5000 milliseconds" },
                { status: 400 }
            );
        }

        // Validate slideDelay
        const delay = parseInt(slideDelay);
        if (isNaN(delay) || delay < 1000 || delay > 10000) {
            return NextResponse.json(
                { error: "Slide delay must be between 1000 and 10000 milliseconds" },
                { status: 400 }
            );
        }

        // Validate animationType
        const validTypes = ["slide", "fade", "zoom"];
        if (!validTypes.includes(animationType)) {
            return NextResponse.json(
                { error: "Animation type must be one of: slide, fade, zoom" },
                { status: 400 }
            );
        }

        // Validate loop
        const shouldLoop = loop === true || loop === false ? loop : true;

        // Validate arrowDisplay
        const validArrowDisplays = ["show", "hover", "invisible"];
        const arrowDisplayValue = validArrowDisplays.includes(arrowDisplay) ? arrowDisplay : "hover";

        let settings = await prisma.bannerSettings.findFirst();

        if (settings) {
            settings = await prisma.bannerSettings.update({
                where: { id: settings.id },
                data: {
                    animationSpeed: speed,
                    slideDelay: delay,
                    animationType,
                    loop: shouldLoop,
                    arrowDisplay: arrowDisplayValue,
                },
            });
        } else {
            settings = await prisma.bannerSettings.create({
                data: {
                    animationSpeed: speed,
                    slideDelay: delay,
                    animationType,
                    loop: shouldLoop,
                    arrowDisplay: arrowDisplayValue,
                },
            });
        }

        return NextResponse.json({
            message: "Banner settings updated successfully",
            settings,
        });
    } catch (error) {
        console.error("Error updating banner settings:", error);
        return NextResponse.json(
            { error: "Failed to update settings. Please try again." },
            { status: 500 }
        );
    }
}
