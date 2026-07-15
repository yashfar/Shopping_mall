import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: Pool | undefined;
};

function createPool() {
    return new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 5,
        idleTimeoutMillis: 0,          // never close idle connections → Neon stays awake
        connectionTimeoutMillis: 30_000,
        keepAlive: true,               // TCP keepalive probes keep Neon compute active
        keepAliveInitialDelayMillis: 10_000,
    });
}

const pool = globalForPrisma.pool ?? createPool();
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
    globalForPrisma.prisma = prisma;
}
