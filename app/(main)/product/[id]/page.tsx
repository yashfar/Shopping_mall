import { notFound } from "next/navigation";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import ProductDetailClient from "./ProductDetailClient";

interface ProductPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params;

    // Fetch product with images and reviews
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            images: {
                orderBy: {
                    createdAt: "asc",
                },
            },
            category: true,
            reviews: {
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
            },
        },
    });

    if (!product) {
        notFound();
    }

    // Calculate average rating
    const averageRating =
        product.reviews.length > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
            product.reviews.length
            : 0;

    // Get current user session
    const session = await auth();

    // Check if current user has reviewed this product
    const userReview = (session
        ? product.reviews.find((review) => review.userId === session.user.id)
        : null) || null;

    return (
        <ProductDetailClient
            product={product}
            averageRating={averageRating}
            userReview={userReview}
            isAuthenticated={!!session}
        />
    );
}
