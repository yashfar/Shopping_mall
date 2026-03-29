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
            return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
        }

        // Validate header
        const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
        const requiredFields = ["title", "price", "stock"];
        for (const field of requiredFields) {
            if (!header.includes(field)) {
                return NextResponse.json({ error: `Missing required column: ${field}` }, { status: 400 });
            }
        }

        const titleIdx = header.indexOf("title");
        const descIdx = header.indexOf("description");
        const priceIdx = header.indexOf("price");
        const salePriceIdx = header.indexOf("saleprice");
        const stockIdx = header.indexOf("stock");
        const categoryIdx = header.indexOf("category");
        const isActiveIdx = header.indexOf("isactive");
        const thumbnailIdx = header.indexOf("thumbnail");

        const errors: string[] = [];
        let created = 0;

        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            const row = i + 1;

            const title = cols[titleIdx]?.trim();
            if (!title) {
                errors.push(`Row ${row}: Missing title`);
                continue;
            }

            const price = Math.round(parseFloat(cols[priceIdx]) * 100);
            if (isNaN(price) || price <= 0) {
                errors.push(`Row ${row}: Invalid price`);
                continue;
            }

            let salePrice: number | null = null;
            if (salePriceIdx >= 0 && cols[salePriceIdx]?.trim()) {
                salePrice = Math.round(parseFloat(cols[salePriceIdx]) * 100);
                if (isNaN(salePrice) || salePrice <= 0) {
                    salePrice = null;
                } else if (salePrice >= price) {
                    errors.push(`Row ${row}: Sale price must be less than price, skipping sale price`);
                    salePrice = null;
                }
            }

            const stock = parseInt(cols[stockIdx]);
            if (isNaN(stock) || stock < 0) {
                errors.push(`Row ${row}: Invalid stock`);
                continue;
            }

            const description = descIdx >= 0 ? cols[descIdx]?.trim() || null : null;
            const categoryName = categoryIdx >= 0 ? cols[categoryIdx]?.trim() || null : null;
            const isActive = isActiveIdx >= 0 ? cols[isActiveIdx]?.toLowerCase() !== "false" : stock > 0;
            const thumbnail = thumbnailIdx >= 0 ? cols[thumbnailIdx]?.trim() || null : null;

            try {
                await prisma.product.create({
                    data: {
                        title,
                        description,
                        price,
                        salePrice,
                        stock,
                        isActive,
                        thumbnail,
                        ...(categoryName && {
                            category: {
                                connectOrCreate: {
                                    where: { name: categoryName },
                                    create: { name: categoryName },
                                },
                            },
                        }),
                    },
                });
                created++;
            } catch (err) {
                errors.push(`Row ${row}: Failed to create "${title}"`);
            }
        }

        return NextResponse.json({
            created,
            total: lines.length - 1,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch {
        return NextResponse.json({ error: "Failed to process CSV" }, { status: 500 });
    }
}
