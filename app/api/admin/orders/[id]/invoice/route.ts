import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

/**
 * GET /api/admin/orders/[id]/invoice
 * Generates and downloads invoice PDF (admin only)
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        // Fetch order with all details
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                title: true,
                                description: true,
                            },
                        },
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Fetch user's primary address (first address)
        const address = order.user ? await prisma.address.findFirst({
            where: { userId: order.user.id },
            orderBy: { createdAt: "desc" },
        }) : null;

        // Create PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 20;

        // Header - Store Name
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("MY STORE", pageWidth / 2, yPos, { align: "center" });
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Invoice", pageWidth / 2, yPos, { align: "center" });
        yPos += 15;

        // Order Information
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Order Information", 20, yPos);
        yPos += 7;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Order ID: ${order.id}`, 20, yPos);
        yPos += 5;
        doc.text(
            `Order Date: ${new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            })}`,
            20,
            yPos
        );
        yPos += 5;
        doc.text(`Status: ${order.status}`, 20, yPos);
        yPos += 10;

        // Customer Information
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Customer Information", 20, yPos);
        yPos += 7;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const customerName = order.user?.firstName && order.user?.lastName
            ? `${order.user.firstName} ${order.user.lastName}`
            : order.user?.email || "N/A";
        doc.text(`Name: ${customerName}`, 20, yPos);
        yPos += 5;
        doc.text(`Email: ${order.user?.email || "N/A"}`, 20, yPos);
        yPos += 5;
        if (order.user?.phone) {
            doc.text(`Phone: ${order.user.phone}`, 20, yPos);
            yPos += 5;
        }
        yPos += 5;

        // Shipping Address
        if (address) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("Shipping Address", 20, yPos);
            yPos += 7;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`${address.firstName} ${address.lastName}`, 20, yPos);
            yPos += 5;
            doc.text(`${address.fullAddress}`, 20, yPos);
            yPos += 5;
            doc.text(`${address.neighborhood}, ${address.district}`, 20, yPos);
            yPos += 5;
            doc.text(`${address.city}`, 20, yPos);
            yPos += 5;
            doc.text(`Phone: ${address.phone}`, 20, yPos);
            yPos += 10;
        }

        // Items Table Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Order Items", 20, yPos);
        yPos += 7;

        // Table headers
        doc.setFontSize(9);
        doc.text("Item", 20, yPos);
        doc.text("Qty", 120, yPos, { align: "center" });
        doc.text("Price", 150, yPos, { align: "right" });
        doc.text("Total", 180, yPos, { align: "right" });
        yPos += 5;

        // Draw line
        doc.line(20, yPos, 190, yPos);
        yPos += 5;

        // Items
        doc.setFont("helvetica", "normal");
        order.items.forEach((item) => {
            const itemTotal = (item.price * item.quantity) / 100;
            doc.text(item.product.title.substring(0, 40), 20, yPos);
            doc.text(item.quantity.toString(), 120, yPos, { align: "center" });
            doc.text(`$${(item.price / 100).toFixed(2)}`, 150, yPos, { align: "right" });
            doc.text(`$${itemTotal.toFixed(2)}`, 180, yPos, { align: "right" });
            yPos += 6;
        });

        yPos += 5;
        doc.line(20, yPos, 190, yPos);
        yPos += 7;

        // Totals
        const subtotal = order.total / 100;
        const shippingCost = 0; // You can calculate this based on your logic
        const total = subtotal;

        doc.setFont("helvetica", "normal");
        doc.text("Subtotal:", 150, yPos, { align: "right" });
        doc.text(`$${subtotal.toFixed(2)}`, 180, yPos, { align: "right" });
        yPos += 6;

        doc.text("Shipping:", 150, yPos, { align: "right" });
        doc.text(`$${shippingCost.toFixed(2)}`, 180, yPos, { align: "right" });
        yPos += 6;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Total:", 150, yPos, { align: "right" });
        doc.text(`$${total.toFixed(2)}`, 180, yPos, { align: "right" });

        // Footer
        yPos = doc.internal.pageSize.getHeight() - 20;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Thank you for your business!", pageWidth / 2, yPos, { align: "center" });

        // Generate PDF as buffer
        const pdfBuffer = doc.output("arraybuffer");

        // Return PDF as download
        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="invoice-${order.id}.pdf"`,
            },
        });
    } catch (error) {
        console.error("Error generating invoice:", error);
        return NextResponse.json(
            { error: "Failed to generate invoice" },
            { status: 500 }
        );
    }
}
