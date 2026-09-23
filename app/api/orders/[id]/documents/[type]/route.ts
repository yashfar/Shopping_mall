import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

const types = {
  "pre-contract": "PRE_CONTRACT_INFORMATION",
  "distance-sales": "DISTANCE_SALES_AGREEMENT",
} as const;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; type: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, type } = await params;
  const documentType = types[type as keyof typeof types];
  if (!documentType) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  const snapshot = await prisma.orderAgreementSnapshot.findUnique({
    where: { orderId_documentType: { orderId: id, documentType } },
    include: { order: { select: { userId: true, orderNumber: true } } },
  });
  if (!snapshot) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (snapshot.order.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const filename = `${type}-${snapshot.order.orderNumber || id}.html`;
  return new NextResponse(snapshot.contentHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
