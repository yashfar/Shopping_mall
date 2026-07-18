import { resolve } from 'node:path';
import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../app/generated/prisma/client';
import { Pool } from 'pg';

config({ path: resolve(process.cwd(), '../backend_nest/.env') });

function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('ş', 's')
    .replaceAll('ğ', 'g')
    .replaceAll('ç', 'c')
    .replaceAll('ö', 'o')
    .replaceAll('ü', 'u')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        category: { select: { name: true, nameEn: true } },
      },
    });

    const batchSize = 50;
    for (let start = 0; start < products.length; start += batchSize) {
      const batch = products.slice(start, start + batchSize);
      await prisma.$transaction(
        batch.map((product) =>
          prisma.product.update({
            where: { id: product.id },
            data: {
              searchText: normalizeSearchText(
                [
                  product.title,
                  product.description,
                  product.category?.name,
                  product.category?.nameEn,
                ]
                  .filter(Boolean)
                  .join(' '),
              ),
            },
          }),
        ),
      );
    }

    console.log(`SEARCH_TEXT_BACKFILLED products=${products.length}`);

    for (const search of ['gözlük', 'gozluk', 'GÖZLÜK']) {
      const matches = await prisma.product.findMany({
        where: {
          isActive: true,
          searchText: { contains: normalizeSearchText(search) },
        },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
      });
      console.log(
        `SEARCH_VERIFY term=${search} matches=${matches.length} firstId=${matches[0]?.id ?? 'none'}`,
      );
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
