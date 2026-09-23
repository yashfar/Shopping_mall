import "dotenv/config";

import { Client } from "pg";

async function main() {
  const sourceUrl = process.env.DATABASE_URL;
  const targetUrl = process.env.STAGING_DATABASE_URL;
  if (!sourceUrl || !targetUrl) {
    throw new Error("DATABASE_URL and STAGING_DATABASE_URL are required");
  }

  const target = new URL(targetUrl);
  const databaseName = target.pathname.slice(1).toLowerCase();
  if (
    !["127.0.0.1", "localhost"].includes(target.hostname) ||
    !databaseName.includes("staging")
  ) {
    throw new Error("Refusing to prepare a non-local or non-staging target database");
  }

  const source = new Client({ connectionString: sourceUrl });
  const destination = new Client({ connectionString: targetUrl });

  try {
    await source.connect();
    await destination.connect();
    const migrations = await source.query<{
      id: string;
      checksum: string;
      finished_at: Date | null;
      migration_name: string;
      logs: string | null;
      rolled_back_at: Date | null;
      started_at: Date;
      applied_steps_count: number;
    }>(`SELECT id, checksum, finished_at, migration_name, logs, rolled_back_at,
               started_at, applied_steps_count
          FROM _prisma_migrations
         ORDER BY started_at`);

    await destination.query("BEGIN");
    await destination.query(`
      CREATE TABLE IF NOT EXISTS _prisma_migrations (
        id VARCHAR(36) PRIMARY KEY NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        finished_at TIMESTAMPTZ,
        migration_name VARCHAR(255) NOT NULL,
        logs TEXT,
        rolled_back_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        applied_steps_count INTEGER NOT NULL DEFAULT 0
      )
    `);
    const existing = await destination.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM _prisma_migrations",
    );
    if (existing.rows[0]?.count !== "0") {
      throw new Error("Target migration history is not empty");
    }

    for (const migration of migrations.rows) {
      await destination.query(
        `INSERT INTO _prisma_migrations
           (id, checksum, finished_at, migration_name, logs, rolled_back_at,
            started_at, applied_steps_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          migration.id,
          migration.checksum,
          migration.finished_at,
          migration.migration_name,
          migration.logs,
          migration.rolled_back_at,
          migration.started_at,
          migration.applied_steps_count,
        ],
      );
    }
    await destination.query("COMMIT");
    console.log(`Copied ${migrations.rowCount ?? 0} migration metadata records`);
  } catch (error) {
    await destination.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await Promise.allSettled([source.end(), destination.end()]);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Staging preparation failed");
  process.exitCode = 1;
});
