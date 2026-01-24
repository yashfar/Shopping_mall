import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AddReviewSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
    comment: z.string().optional().nullable(),
});

/**
 * POST /api/review/add
 * Add a review for a product (Authenticated users only)
 */
export async function POST(req: Request) {
    const session = await auth();

    // Check authentication
    if (!session) {
        return NextResponse.json(
            { error: "Unauthorized: Please login to review products" },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const validation = AddReviewSchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            }));

            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: errors,
                },
                { status: 400 }
            );
        }

        const { productId, rating, comment } = validation.data;

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Check if user already reviewed this product
        const existingReview = await prisma.review.findFirst({
            where: {
                productId,
                userId: session.user.id,
            },
        });

        if (existingReview) {
            return NextResponse.json(
                {
                    error: "Already reviewed",
                    message: "You have already reviewed this product",
                },
                { status: 409 }
            );
        }

        // Create the review
        const review = await prisma.review.create({
            data: {
                productId,
                userId: session.user.id,
                rating,
                comment: comment || null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        // Get updated reviews for the product
        const reviews = await prisma.review.findMany({
            where: { productId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Calculate average rating
        const avgRating =
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        return NextResponse.json(
            {
                success: true,
                message: "Review added successfully",
                review,
                averageRating: avgRating,
                totalReviews: reviews.length,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error adding review:", error);

        // Handle Prisma errors
        if (error.code === "P2003") {
            return NextResponse.json(
                {
                    error: "Invalid reference",
                    message: "Product or user not found",
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                error: "Internal server error",
                message: "Failed to add review. Please try again later.",
            },
            { status: 500 }
        );
    }
}
