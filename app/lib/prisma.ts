import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma_v3: PrismaClient | undefined;
  pool_v3: Pool | undefined;
};

const pool = globalForPrisma.pool_v3 ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 20000,       // 20s — bağlantıyı DB kapatmadan önce biz kapatalım
  connectionTimeoutMillis: 10000, // 10s bağlantı kuramazsa hata ver
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma_v3 ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pool_v3 = pool;
  globalForPrisma.prisma_v3 = prisma;
}
