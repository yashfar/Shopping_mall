export type SortOption =
    | "price_asc"
    | "price_desc"
    | "newest"
    | "oldest"
    | "rating_desc"
    | "reviews_desc";

export function getSortOrder(sort: string | undefined): any {
    switch (sort) {
        case "price_asc":
            return { price: "asc" };
        case "price_desc":
            return { price: "desc" };
        case "oldest":
            return { createdAt: "asc" };
        case "rating_desc":
        case "reviews_desc":
            // For rating and reviews, we'll sort client-side after fetching
            // Default to newest for database query
            return { createdAt: "desc" };
        case "newest":
        default:
            return { createdAt: "desc" };
    }
}

export interface ProductWithReviews {
    reviews: { rating: number }[];
    [key: string]: any;
}

export function sortProducts<T extends ProductWithReviews>(
    products: T[],
    sort: string | undefined
): T[] {
    if (!sort) return products;

    switch (sort) {
        case "rating_desc":
            return [...products].sort((a, b) => {
                const avgA =
                    a.reviews.length > 0
                        ? a.reviews.reduce((sum, r) => sum + r.rating, 0) / a.reviews.length
                        : 0;
                const avgB =
                    b.reviews.length > 0
                        ? b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length
                        : 0;
                return avgB - avgA; // Descending
            });

        case "reviews_desc":
            return [...products].sort((a, b) => b.reviews.length - a.reviews.length);

        default:
            return products;
    }
}
