import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/orders/[id]/upload-payment
 * Upload payment proof (receipt) for a bank transfer order.
 * Accepts a file via FormData and updates order status to PAYMENT_UPLOADED.
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const order = await prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Allow upload for PENDING or PAYMENT_REJECTED orders (re-upload after rejection)
        if (order.status !== "PENDING" && order.status !== "PAYMENT_REJECTED") {
            return NextResponse.json(
                { error: "Payment proof can only be uploaded for pending or rejected orders" },
                { status: 400 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Validate file type (images and PDFs only)
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Please upload an image (JPG, PNG, WebP) or PDF." },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 5MB." },
                { status: 400 }
            );
        }

        const bucket = process.env.SUPABASE_BUCKET || "products";
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const path = `payment-proofs/${id}-${timestamp}-${safeName}`;

        // Delete previous proof if re-uploading
        if (order.paymentProofPath) {
            await supabaseAdmin.storage.from(bucket).remove([order.paymentProofPath]);
        }

        const { error: uploadError } = await supabaseAdmin.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (uploadError) {
            console.error("Payment proof upload error:", uploadError);
            return NextResponse.json(
                { error: "Failed to upload file" },
                { status: 500 }
            );
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(path);

        // Update order with proof and set status
        await prisma.order.update({
            where: { id },
            data: {
                paymentProofUrl: publicUrl,
                paymentProofPath: path,
                status: "PAYMENT_UPLOADED",
            },
        });

        return NextResponse.json({
            message: "Payment proof uploaded successfully",
            url: publicUrl,
        });
    } catch (error) {
        console.error("Error uploading payment proof:", error);
        return NextResponse.json(
            { error: "Failed to upload payment proof" },
            { status: 500 }
        );
    }
}
