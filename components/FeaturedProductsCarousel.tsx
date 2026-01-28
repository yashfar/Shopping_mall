"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";

interface Product {
    id: string;
    title: string;
    price: number;
    thumbnail: string | null;
    stock: number;
    category?: { name: string } | null;
}

interface FeaturedProductsCarouselProps {
    title: string;
    products: Product[];
    linkHref?: string;
    linkText?: string;
}

export default function FeaturedProductsCarousel({
    title,
    products,
    linkHref,
    linkText = "View All",
}: FeaturedProductsCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener("resize", checkScroll);
        return () => window.removeEventListener("resize", checkScroll);
    }, [products]);

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            const targetScroll =
                scrollContainerRef.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount);

            scrollContainerRef.current.scrollTo({
                left: targetScroll,
                behavior: "smooth",
            });

            // Check scroll after animation
            setTimeout(checkScroll, 300);
        }
    };

    if (products.length === 0) return null;

    return (
        <section className="py-12 bg-white">
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight mb-2">
                            {title}
                        </h2>
                        <div className="h-1 w-20 bg-[#C8102E]" />
                    </div>

                    <div className="flex gap-4">
                        {linkHref && (
                            <Link
                                href={linkHref}
                                className="hidden sm:block text-sm font-bold text-[#A9A9A9] hover:text-[#C8102E] transition-colors mb-1 mr-4"
                            >
                                {linkText}
                            </Link>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={() => scroll("left")}
                                disabled={!canScrollLeft}
                                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-[#FAFAFA] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-5 h-5 text-[#1A1A1A]" />
                            </button>
                            <button
                                onClick={() => scroll("right")}
                                disabled={!canScrollRight}
                                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-[#FAFAFA] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-5 h-5 text-[#1A1A1A]" />
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {products.map((product) => (
                        <Link
                            key={product.id}
                            href={`/product/${product.id}`}
                            className="flex-shrink-0 w-[240px] snap-start group"
                        >
                            <div className="relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden mb-4 border border-gray-100">
                                {product.thumbnail ? (
                                    <Image
                                        src={product.thumbnail}
                                        alt={product.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        Scan Image
                                    </div>
                                )}
                                {product.stock <= 0 && (
                                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                        <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold">
                                            Out of Stock
                                        </span>
                                    </div>
                                )}
                                <div className="absolute bottom-4 right-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                    <div className="bg-white p-2.5 rounded-full shadow-lg border border-gray-100 text-[#1A1A1A] hover:bg-[#C8102E] hover:text-white transition-colors">
                                        <ShoppingCart className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            <h3 className="font-bold text-[#1A1A1A] line-clamp-1 group-hover:text-[#C8102E] transition-colors">
                                {product.title}
                            </h3>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-gray-500 text-sm">
                                    ${(product.price / 100).toFixed(2)}
                                </p>
                                {product.category && (
                                    <span className="text-xs text-gray-400 font-medium">
                                        {product.category.name}
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}

                    {/* View All Card */}
                    {linkHref && (
                        <Link
                            href={linkHref}
                            className="flex-shrink-0 w-[160px] snap-start flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-[#C8102E] hover:text-[#C8102E] transition-all"
                        >
                            <span className="font-bold">View All</span>
                            <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white">
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}
