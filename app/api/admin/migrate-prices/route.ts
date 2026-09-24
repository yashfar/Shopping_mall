import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/migrate-prices
 * Bulk-create TRY and/or USD ProductPrice rows for products missing them.
 * Body: { usdRate?: number }  — if provided, also creates USD prices using TRY÷usdRate
 */
export async function POST(req: Request) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let usdRate: number | undefined;
    let overwrite = false;
    try {
        const body = await req.json().catch(() => ({}));
        if (body.usdRate) {
            usdRate = Number(body.usdRate);
            if (!isFinite(usdRate) || usdRate <= 0) {
                return NextResponse.json({ error: "Invalid usdRate" }, { status: 400 });
            }
        }
        overwrite = !!body.overwrite;
    } catch {
        // no body — TRY-only migration
    }

    try {
        const products = await prisma.product.findMany({
            select: { id: true, price: true, salePrice: true },
        });

        let tryCreated = 0;
        let usdCreated = 0;
        let skipped = 0;

        for (const product of products) {
            // TRY
            const existingTry = await prisma.productPrice.findUnique({
                where: { productId_currencyCode: { productId: product.id, currencyCode: "TRY" } },
            });
            if (!existingTry) {
                await prisma.productPrice.create({
                    data: {
                        productId: product.id,
                        currencyCode: "TRY",
                        price: product.price,
                        salePrice: product.salePrice,
                    },
                });
                tryCreated++;
            } else {
                skipped++;
            }

            // USD
            if (usdRate) {
                const usdPrice = Math.round((product.price / usdRate) * 100) / 100;
                const usdSalePrice = product.salePrice
                    ? Math.round((product.salePrice / usdRate) * 100) / 100
                    : null;

                if (overwrite) {
                    await prisma.productPrice.upsert({
                        where: { productId_currencyCode: { productId: product.id, currencyCode: "USD" } },
                        create: { productId: product.id, currencyCode: "USD", price: usdPrice, salePrice: usdSalePrice },
                        update: { price: usdPrice, salePrice: usdSalePrice },
                    });
                    usdCreated++;
                } else {
                    const existingUsd = await prisma.productPrice.findUnique({
                        where: { productId_currencyCode: { productId: product.id, currencyCode: "USD" } },
                    });
                    if (!existingUsd) {
                        await prisma.productPrice.create({
                            data: { productId: product.id, currencyCode: "USD", price: usdPrice, salePrice: usdSalePrice },
                        });
                        usdCreated++;
                    }
                }
            }
        }

        return NextResponse.json({ ok: true, tryCreated, usdCreated, skipped, total: products.length });
    } catch (error) {
        console.error("migrate-prices error:", error);
        return NextResponse.json({ error: "Migration failed" }, { status: 500 });
    }
}
