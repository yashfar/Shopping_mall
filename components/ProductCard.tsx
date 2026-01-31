"use client";

import { useCart } from "@@/context/CartContext";
import { Star, ShoppingCart, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    category?: string | { name: string };
    createdAt?: Date | string;
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

    // Check if new (e.g. created within last 7 days) - placeholder logic
    const isNew = false;

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
        <div
            onClick={handleClick}
            className="group relative bg-white rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 cursor-pointer border border-[#E5E5E5] overflow-hidden flex flex-col h-full"
        >
            {/* Image Container */}
            <div className="relative aspect-[3/4] h-[200px] md:h-auto w-full bg-[#f9f9f9] overflow-hidden">
                {product.thumbnail ? (
                    <Image
                        src={product.thumbnail}
                        alt={product.title}
                        fill
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1}
                            stroke="currentColor"
                            className="w-16 h-16"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                            />
                        </svg>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                    {isNew && (
                        <span className="bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                            New
                        </span>
                    )}
                    {product.stock === 0 && (
                        <span className="bg-[#C8102E] text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            Out of Stock
                        </span>
                    )}
                </div>

                {/* Quick Add Button (Desktop: Hover Only / Mobile: Always Visible) */}
                <button
                    onClick={handleAddToCart}
                    disabled={isAdding || product.stock === 0}
                    className="absolute bottom-3 right-3 h-10 w-10 bg-white text-[#1A1A1A] rounded-full shadow-lg flex items-center justify-center transition-all duration-300 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#C8102E] hover:text-white lg:flex hidden"
                    title="Add to Cart"
                >
                    {isAdding ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <ShoppingCart className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Content Info */}
            <div className="p-4 flex flex-col gap-2 flex-grow relative">
                {/* Category (Optional Placeholder) */}
                {typeof product.category === 'object' && product.category?.name && (
                    <span className="text-[10px] font-bold text-[#C8102E] uppercase tracking-wider">
                        {product.category.name}
                    </span>
                )}

                {/* Title */}
                <h3
                    className="text-[#1A1A1A] font-bold text-base leading-snug line-clamp-2 group-hover:text-[#C8102E] transition-colors"
                >
                    {product.title}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mt-auto">
                    <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                fill={i < Math.round(averageRating) ? "currentColor" : "none"}
                                className={`w-3.5 h-3.5 ${i < Math.round(averageRating) ? "text-yellow-400" : "text-gray-300"}`}
                            />
                        ))}
                    </div>
                    {reviewCount > 0 && (
                        <span className="text-xs text-gray-400 font-medium pt-0.5">
                            ({reviewCount})
                        </span>
                    )}
                </div>

                {/* Price & Mobile Add Button */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                        <span className="text-lg font-extrabold text-[#1A1A1A] tracking-tight">
                            ${(product.price / 100).toFixed(2)}
                        </span>
                    </div>

                    {/* Mobile Only Add Button */}
                    <button
                        onClick={handleAddToCart}
                        disabled={isAdding || product.stock === 0}
                        className="lg:hidden h-9 w-9 bg-gray-100 text-[#1A1A1A] rounded-full flex items-center justify-center active:bg-[#C8102E] active:text-white transition-colors"
                    >
                        {isAdding ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <ShoppingCart className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
