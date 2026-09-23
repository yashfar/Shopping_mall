import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { userId: true, agreementSnapshots: { select: { documentType: true, templateVersion: true, locale: true, acceptedAt: true, integrityHash: true, deliveryStatus: true, deliveryAttempts: true, deliveredAt: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ documents: order.agreementSnapshots });
}
