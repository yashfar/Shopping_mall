"use client";

import { useCart } from "@@/context/CartContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import StarRating from "./StarRating";

interface Review {
    id: string;
    rating: number;
}

interface Product {
    id: string;
    title: string;
    price: number;
    thumbnail: string | null;
    reviews?: Review[];
    stock?: number;
}

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const router = useRouter();
    const [isAdding, setIsAdding] = useState(false);

    // Calculate average rating
    const averageRating =
        product.reviews && product.reviews.length > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
            product.reviews.length
            : 0;

    const reviewCount = product.reviews?.length || 0;

    const handleClick = () => {
        router.push(`/product/${product.id}`);
    };

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAdding) return;

        setIsAdding(true);
        await addToCart(product.id, 1);
        setIsAdding(false);
    };

    return (
        <div className="relative">

            <div
                onClick={handleClick}
                className="product-card group cursor-pointer bg-white rounded-xl border border-[#A9A9A9]/20 hover:border-[#C8102E] transition-all duration-300 hover:shadow-[0px_4px_12px_rgba(200,16,46,0.15)] overflow-hidden flex flex-col h-full"
            >
                {/* Product Image */}
                <div className="relative w-full h-[240px] bg-[#FAFAFA] overflow-hidden">
                    {product.thumbnail ? (
                        <Image
                            src={product.thumbnail}
                            alt={product.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1}
                                stroke="currentColor"
                                className="w-16 h-16 text-[#A9A9A9]"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                                />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="p-5 flex flex-col gap-3 flex-grow">
                    {/* Title */}
                    <h3
                        className="text-[#1A1A1A] font-bold text-lg line-clamp-2 min-h-[3.5rem] leading-snug group-hover:text-[#C8102E] transition-colors"
                        title={product.title}
                    >
                        {product.title}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                        <StarRating rating={averageRating} size="sm" />
                        {reviewCount > 0 ? (
                            <div className="flex items-center gap-1.5 text-sm font-semibold">
                                <span className="text-[#1A1A1A]">
                                    {averageRating.toFixed(1)}
                                </span>
                                <span className="text-[#A9A9A9]">•</span>
                                <span className="text-[#A9A9A9]">
                                    {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                                </span>
                            </div>
                        ) : (
                            <span className="text-sm font-medium text-[#A9A9A9]">No reviews yet</span>
                        )}
                    </div>

                    {/* Price and Add to Cart */}
                    <div className="mt-auto pt-4 flex items-center justify-between">
                        <span className="text-2xl font-extrabold text-[#C8102E]">
                            ${(product.price / 100).toFixed(2)}
                        </span>

                        <button
                            onClick={handleAddToCart}
                            disabled={isAdding}
                            className="bg-[#C8102E] hover:bg-[#A90D27] text-white p-3 rounded-xl transition-all duration-300 shadow-md flex items-center justify-center group-active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            title="Add to Cart"
                        >
                            {isAdding ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
