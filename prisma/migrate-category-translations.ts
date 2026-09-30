/**
 * One-time data migration: populate CategoryTranslation rows from
 * the legacy Category.name and Category.nameEn fields.
 *
 * Safe to re-run: uses upsert so existing rows are not duplicated.
 * Slugs are always updated on re-run to pick up any slug-generation fixes.
 *
 * Run with: npx tsx prisma/migrate-category-translations.ts
 */

import "dotenv/config";
import { prisma } from "../app/lib/prisma";

const TR_MAP: Record<string, string> = {
    "ı": "i", "ğ": "g", "ş": "s", "ö": "o", "ü": "u", "ç": "c",
    "İ": "i", "Ğ": "g", "Ş": "s", "Ö": "o", "Ü": "u", "Ç": "c",
};

function toSlug(name: string): string {
    return name
        .replace(/[ığşöüçİĞŞÖÜÇ]/g, (c) => TR_MAP[c] ?? c)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function main() {
    const categories = await prisma.category.findMany();

    console.log(`Found ${categories.length} categories. Migrating translations...`);

    let trCount = 0;
    let enCount = 0;

    for (const cat of categories) {
        await prisma.categoryTranslation.upsert({
            where: { categoryId_locale: { categoryId: cat.id, locale: "tr" } },
            update: { slug: toSlug(cat.name) },
            create: {
                categoryId: cat.id,
                locale: "tr",
                name: cat.name,
                slug: toSlug(cat.name),
            },
        });
        trCount++;

        if (cat.nameEn) {
            await prisma.categoryTranslation.upsert({
                where: { categoryId_locale: { categoryId: cat.id, locale: "en" } },
                update: { slug: toSlug(cat.nameEn) },
                create: {
                    categoryId: cat.id,
                    locale: "en",
                    name: cat.nameEn,
                    slug: toSlug(cat.nameEn),
                },
            });
            enCount++;
        }

        const slug = toSlug(cat.name);
        console.log(`  [${cat.id}] "${cat.name}" → "${slug}"` + (cat.nameEn ? ` / EN: "${toSlug(cat.nameEn)}"` : ""));
    }

    console.log(`\nDone. TR: ${trCount}, EN: ${enCount}`);
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
