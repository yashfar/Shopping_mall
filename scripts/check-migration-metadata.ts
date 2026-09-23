import "dotenv/config";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Client } from "pg";

const SEARCH_MIGRATION = "20260718090000_add_product_search_text";
const RETURN_MIGRATION = "20260922000001_expand_return_workflow";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");

  const searchSql = await readFile(
    `prisma/migrations/${SEARCH_MIGRATION}/migration.sql`,
  );
  const localChecksum = createHash("sha256").update(searchSql).digest("hex");
  const client = new Client({ connectionString: url });

  try {
    await client.connect();
    const result = await client.query<{
      migration_name: string;
      checksum: string;
      finished: boolean;
      rolled_back: boolean;
    }>(
      `SELECT migration_name,
              checksum,
              finished_at IS NOT NULL AS finished,
              rolled_back_at IS NOT NULL AS rolled_back
         FROM _prisma_migrations
        WHERE migration_name = ANY($1::text[])
        ORDER BY migration_name`,
      [[SEARCH_MIGRATION, RETURN_MIGRATION]],
    );

    const records = result.rows.map((record) => ({
      migration: record.migration_name,
      finished: record.finished,
      rolledBack: record.rolled_back,
      ...(record.migration_name === SEARCH_MIGRATION
        ? { checksumMatchesRecoveredFile: record.checksum === localChecksum }
        : {}),
    }));

    console.log(JSON.stringify({ records }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Metadata check failed");
  process.exitCode = 1;
});
