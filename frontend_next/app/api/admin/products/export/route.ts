import { auth } from "@@/lib/auth-helper";
import { createProductExportStream } from "@/lib/csv/exporter";

// Never serve from cache — product data changes continuously.
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const date = new Date().toISOString().split("T")[0];

  return new Response(createProductExportStream(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${date}.csv"`,
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-store",
    },
  });
}
