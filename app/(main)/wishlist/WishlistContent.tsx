"use client";

import { useWishlist } from "@@/context/WishlistContext";
import ProductCard from "@@/components/ProductCard";
import Link from "next/link";
import { Heart } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WishlistProduct = any;

interface WishlistContentProps {
    initialProducts: WishlistProduct[];
}

export default function WishlistContent({ initialProducts }: WishlistContentProps) {
    const { wishlistIds } = useWishlist();

    // Filter out products removed during this session
    const products = initialProducts.filter((p) => wishlistIds.has(p.id));

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
                    <Heart className="w-10 h-10 text-[#C8102E] opacity-40" />
                </div>
                <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Your wishlist is empty</h2>
                <p className="text-[#A9A9A9] mb-8">Browse products and click the heart icon to save your favourites.</p>
                <Link
                    href="/products"
                    className="bg-[#C8102E] hover:bg-[#A90D27] text-white font-bold px-8 py-3 rounded-full transition-colors shadow-[0_4px_14px_rgba(200,16,46,0.3)]"
                >
                    Browse Products
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
