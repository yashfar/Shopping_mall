import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

/**
 * GET /api/admin/orders/[id]/shipping-label
 * Generates and downloads shipping label PDF (admin only)
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
        // Fetch order with user details
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
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Fetch user's primary address
        const address = order.user ? await prisma.address.findFirst({
            where: { userId: order.user.id },
            orderBy: { createdAt: "desc" },
        }) : null;

        if (!address) {
            return NextResponse.json(
                { error: "No shipping address found for this order" },
                { status: 404 }
            );
        }

        // Create PDF with 10x15 cm dimensions (standard shipping label)
        // 10cm = 283.46 points, 15cm = 425.2 points
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "pt",
            format: [283.46, 425.2],
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 20;

        // Store Name / From Address
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("FROM:", 20, yPos);
        yPos += 15;

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("MY STORE", 20, yPos);
        yPos += 12;
        doc.text("123 Business Street", 20, yPos);
        yPos += 12;
        doc.text("City, State 12345", 20, yPos);
        yPos += 20;

        // Separator line
        doc.setLineWidth(1);
        doc.line(20, yPos, pageWidth - 20, yPos);
        yPos += 20;

        // To Address
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("SHIP TO:", 20, yPos);
        yPos += 18;

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`${address.firstName} ${address.lastName}`, 20, yPos);
        yPos += 15;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        // Split long address if needed
        const maxWidth = pageWidth - 40;
        const addressLines = doc.splitTextToSize(address.fullAddress, maxWidth);
        addressLines.forEach((line: string) => {
            doc.text(line, 20, yPos);
            yPos += 12;
        });

        doc.text(`${address.neighborhood}, ${address.district}`, 20, yPos);
        yPos += 12;
        doc.text(address.city, 20, yPos);
        yPos += 15;

        doc.setFont("helvetica", "bold");
        doc.text(`Phone: ${address.phone}`, 20, yPos);
        yPos += 25;

        // Order ID Section
        doc.setLineWidth(0.5);
        doc.line(20, yPos, pageWidth - 20, yPos);
        yPos += 15;

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("ORDER ID:", 20, yPos);
        yPos += 12;

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(order.id, 20, yPos);
        yPos += 20;

        // Barcode placeholder (simple text representation)
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("BARCODE:", 20, yPos);
        yPos += 10;

        // Simple barcode representation using lines
        doc.setFontSize(20);
        doc.setFont("courier", "bold");
        const barcodeText = `*${order.id.substring(0, 12).toUpperCase()}*`;
        doc.text(barcodeText, pageWidth / 2, yPos, { align: "center" });

        // Generate PDF as buffer
        const pdfBuffer = doc.output("arraybuffer");

        // Return PDF as download
        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="shipping-label-${order.id}.pdf"`,
            },
        });
    } catch (error) {
        console.error("Error generating shipping label:", error);
        return NextResponse.json(
            { error: "Failed to generate shipping label" },
            { status: 500 }
        );
    }
}
