import "dotenv/config";

import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const target = new URL(url);
if (
  !["127.0.0.1", "localhost"].includes(target.hostname) ||
  !target.pathname.toLowerCase().includes("test")
) {
  throw new Error("Refusing to seed a non-local or non-test database");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  const password = await bcrypt.hash("BrowserTest!234", 10);
  await prisma.user.createMany({
    data: [
      { id: "browser-customer", email: "browser-customer@example.invalid", password, role: "USER", firstName: "Test" },
      { id: "browser-other", email: "browser-other@example.invalid", password, role: "USER", firstName: "Other" },
      { id: "browser-admin", email: "browser-admin@example.invalid", password, role: "ADMIN", firstName: "Admin" },
    ],
  });
  await prisma.product.create({
    data: { id: "browser-product", title: "Browser return fixture", price: 1000, stock: 5 },
  });
  await prisma.order.create({
    data: {
      id: "browser-order",
      orderNumber: "BROWSER-RETURN-1",
      userId: "browser-customer",
      total: 2000,
      status: "COMPLETED",
      items: { create: { id: "browser-order-item", productId: "browser-product", quantity: 2, price: 1000 } },
    },
  });
}

main()
  .then(() => console.log("Synthetic browser fixtures created"))
  .finally(() => prisma.$disconnect());
