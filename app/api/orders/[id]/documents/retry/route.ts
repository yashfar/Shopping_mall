import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { deliverOrderAgreements } from "@@/lib/agreement-delivery";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, select: { userId: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await deliverOrderAgreements(id);
  return NextResponse.json(result, { status: result.status === "failed" ? 502 : 200 });
}
