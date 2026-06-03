import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CSV_HEADER, serializeRow } from "./serializer";
import type { ProductCsvRow } from "./types";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { category: true; translations: true };
}>;

/**
 * Maps a fully-hydrated Prisma product to the flat ProductCsvRow shape.
 *
 * Conversion rules:
 *   - price / salePrice: stored as integer cents → divided by 100
 *   - null strings become ""  (safe empty CSV field, no column shift)
 *   - missing EN translation → empty title_en / description_en
 */
export function mapProductToRow(p: ProductWithRelations): ProductCsvRow {
  const enTranslation = p.translations.find((t) => t.locale === "en");
  return {
    title: p.title,
    description: p.description ?? "",
    title_en: enTranslation?.title ?? "",
    description_en: enTranslation?.description ?? "",
    price: p.price / 100,
    salePrice: p.salePrice !== null ? p.salePrice / 100 : null,
    stock: p.stock,
    category: p.category?.name ?? "",
    isActive: p.isActive,
    thumbnail: p.thumbnail ?? "",
  };
}

const BATCH_SIZE = 500;
const UTF8_BOM = "﻿";

/**
 * Returns a streaming ReadableStream<Uint8Array> that emits the CSV
 * incrementally using cursor-based DB pagination.
 *
 * Why streaming instead of building the full string in memory:
 *   - A catalogue of 10 000 products with long descriptions can easily
 *     exceed 10–20 MB in memory.  Streaming keeps peak RSS near zero.
 *   - The first byte reaches the browser immediately, so the download
 *     progress indicator starts at once rather than after the full query.
 *   - Individual DB batches of BATCH_SIZE rows keep Prisma query time
 *     predictable and prevent long-running transactions.
 *
 * Cursor strategy: orderBy id ASC + cursor on last id of the previous
 * batch.  This is O(1) per batch (Prisma translates it to a WHERE id > ?
 * index seek) unlike OFFSET which degrades as the table grows.
 */
export function createProductExportStream(): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Emit BOM + header as the very first chunk so the browser/Excel
        // can start parsing the structure while data rows are still loading.
        controller.enqueue(encoder.encode(UTF8_BOM + CSV_HEADER + "\n"));

        let cursor: string | undefined = undefined;

        while (true) {
          const batch = await prisma.product.findMany({
            take: BATCH_SIZE,
            ...(cursor !== undefined
              ? { skip: 1, cursor: { id: cursor } }
              : {}),
            include: { category: true, translations: true },
            orderBy: { id: "asc" },
          });

          if (batch.length === 0) break;

          for (const product of batch) {
            controller.enqueue(
              encoder.encode(serializeRow(mapProductToRow(product)) + "\n")
            );
          }

          // Stop if this was the final partial batch
          if (batch.length < BATCH_SIZE) break;
          cursor = batch[batch.length - 1].id;
        }

        controller.close();
      } catch (err) {
        // controller.error cancels the download on the client side and
        // surfaces the error in the server logs.
        controller.error(err);
      }
    },
  });
}
