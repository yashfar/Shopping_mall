"use client";

import { useCart } from "@@/context/CartContext";
import { useWishlist } from "@@/context/WishlistContext";
import { useCurrency, type PriceEntry } from "@@/context/CurrencyContext";
import { Star, ShoppingCart, Loader2, Heart } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";

interface Review {
    id: string;
    rating: number;
}

interface ProductVariant {
    id: string;
    color: string;
    colorHex: string | null;
    stock: number;
}

interface Product {
    id: string;
    title: string;
    price: number;
    salePrice?: number | null;
    prices?: PriceEntry[];
    thumbnail: string | null;
    reviews?: Review[];
    stock?: number;
    category?: string | { name: string };
    createdAt?: Date | string;
    variants?: ProductVariant[];
}

interface ProductCardProps {
    product: Product;
    variant?: "default" | "homeGrid";
}

export default function ProductCard({ product, variant = "default" }: ProductCardProps) {
    const { addToCart } = useCart();
    const { toggle, isWishlisted } = useWishlist();
    const t = useTranslations("productCard");
    const { formatResolvedPrice, resolveProductPrice } = useCurrency();
    const resolved = resolveProductPrice(product);
    const router = useRouter();
    const wishlisted = isWishlisted(product.id);
    const isHomeGrid = variant === "homeGrid";

    const [isAdding, setIsAdding] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [showColorWarning, setShowColorWarning] = useState(false);
    const [shakeCart, setShakeCart] = useState(false);
    const [colorWaveActive, setColorWaveActive] = useState(false);
    const pendingAdd = useRef(false);

    const hasVariants = (product.variants?.length ?? 0) > 0;
    const hasAnyStock = hasVariants
        ? (product.variants?.some((v) => v.stock > 0) ?? false)
        : (product.stock ?? 0) > 0;

    // Calculate average rating
    const averageRating =
        product.reviews && product.reviews.length > 0
            ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
            : 0;
    const reviewCount = product.reviews?.length || 0;
    const isNew = false;

    const handleClick = () => {
        router.push(`/product/${product.id}`);
    };

    const triggerAnimations = () => {
        setShowColorWarning(true);
        setShakeCart(true);
        setColorWaveActive(false);
        requestAnimationFrame(() => setColorWaveActive(true));
        setTimeout(() => setShakeCart(false), 500);
        setTimeout(() => setColorWaveActive(false), 1200);
    };

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAdding) return;

        if (hasVariants && !selectedVariant) {
            pendingAdd.current = true;
            triggerAnimations();
            return;
        }

        setIsAdding(true);
        const result = await addToCart(product.id, 1, selectedVariant?.id ?? undefined);
        if (result === "unauthorized") router.push("/register");
        setIsAdding(false);
    };

    const handleSelectVariant = async (e: React.MouseEvent, variant: ProductVariant) => {
        e.stopPropagation();
        if (variant.stock === 0) return;

        setSelectedVariant(variant);
        setShowColorWarning(false);

        // If user had clicked cart first, auto-add
        if (pendingAdd.current) {
            pendingAdd.current = false;
            setIsAdding(true);
            const result = await addToCart(product.id, 1, variant.id);
            if (result === "unauthorized") router.push("/register");
            setIsAdding(false);
        }
    };

    const cartButtonClass = `${shakeCart ? "card-cart-shake" : ""}`;

    return (
        <>
            <style>{`
                @keyframes card-cart-shake {
                    0%, 100% { transform: translateX(0); }
                    15%       { transform: translateX(-5px); }
                    30%       { transform: translateX(5px); }
                    45%       { transform: translateX(-4px); }
                    60%       { transform: translateX(4px); }
                    75%       { transform: translateX(-2px); }
                    90%       { transform: translateX(2px); }
                }
                .card-cart-shake { animation: card-cart-shake 0.5s ease-in-out; }
                @keyframes card-color-wave {
                    0%   { transform: translateY(0); }
                    25%  { transform: translateY(-5px); }
                    55%  { transform: translateY(2px); }
                    80%  { transform: translateY(-2px); }
                    100% { transform: translateY(0); }
                }
                @keyframes card-warning-in {
                    from { opacity: 0; transform: translateY(-3px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .card-warning-in { animation: card-warning-in 0.2s ease-out; }
            `}</style>

            <div
                onClick={handleClick}
                className={`group relative transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full ${isHomeGrid ? "rounded-2xl bg-card ring-1 ring-border/25 shadow-[0_3px_18px_rgba(15,23,42,0.05)] hover:ring-border/40 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] md:hover:-translate-y-0.5" : "bg-white rounded-2xl border border-[#E5E5E5] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1"}`}
            >
                {/* Image Container */}
                <div className={isHomeGrid ? "relative aspect-[5/6] w-full bg-muted/30 overflow-hidden" : "relative aspect-[3/4] h-[200px] md:h-auto w-full bg-[#f9f9f9] overflow-hidden"}>
                    {product.thumbnail && (product.thumbnail.startsWith("/") || product.thumbnail.startsWith("http")) ? (
                        <Image
                            src={product.thumbnail}
                            alt={product.title}
                            fill
                            className={`object-cover object-center transition-transform duration-700 ${isHomeGrid ? "group-hover:scale-105" : "group-hover:scale-110"}`}
                            sizes={isHomeGrid ? "(max-width: 359px) calc(100vw - 2rem), (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        </div>
                    )}

                    {/* Wishlist Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); toggle(product.id); }}
                        className={`absolute z-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${isHomeGrid ? "top-2 right-2 h-9 w-9 text-muted-foreground" : "top-3 right-3 h-8 w-8 bg-white/90 backdrop-blur-sm shadow-sm"}`}
                        title={wishlisted ? t("removeFromWishlist") : t("addToWishlist")}
                    >
                        {isHomeGrid ? (
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 ring-1 ring-border/30 shadow-sm backdrop-blur-sm md:h-9 md:w-9">
                                <Heart className={`h-3.5 w-3.5 transition-colors md:h-4 md:w-4 ${wishlisted ? "fill-[#C8102E] text-[#C8102E]" : "text-gray-400"}`} />
                            </span>
                        ) : (
                            <Heart className={`w-4 h-4 transition-colors ${wishlisted ? "fill-[#C8102E] text-[#C8102E]" : "text-gray-400"}`} />
                        )}
                    </button>

                    {/* Badges */}
                    <div className={`absolute flex flex-col z-10 ${isHomeGrid ? "top-2 left-2 gap-1.5" : "top-3 left-3 gap-2"}`}>
                        {isNew && (
                            <span className="bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                {t("new")}
                            </span>
                        )}
                        {resolved?.salePrice && product.stock !== 0 && (
                            <span className={`bg-[#C8102E] text-white font-bold rounded-full uppercase tracking-wider ${isHomeGrid ? "px-2 py-1 text-[9px]" : "text-[10px] px-2 py-1 shadow-sm"}`}>
                                -{Math.round((1 - resolved.salePrice / resolved.price) * 100)}%
                            </span>
                        )}
                        {!hasAnyStock && (
                            <span className={`bg-[#C8102E] text-white font-bold rounded-full uppercase tracking-wider ${isHomeGrid ? "px-2 py-1 text-[9px]" : "text-[10px] px-2 py-1 shadow-sm"}`}>
                                {t("outOfStock")}
                            </span>
                        )}
                    </div>

                    {/* Quick Add Button (Desktop hover) */}
                    <button
                        onClick={handleAddToCart}
                        disabled={isAdding || !hasAnyStock}
                        className={`absolute bottom-3 right-3 bg-white text-[#1A1A1A] rounded-full items-center justify-center transition-all duration-300 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#C8102E] hover:text-white lg:flex hidden ${isHomeGrid ? "h-9 w-9 ring-1 ring-border/30 shadow-md" : "h-10 w-10 shadow-lg"} ${cartButtonClass}`}
                        title={t("addToCart")}
                    >
                        {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                    </button>
                </div>

                {/* Content Info */}
                <div className={`flex flex-col flex-grow relative ${isHomeGrid ? "p-2.5 gap-1 md:p-3 md:gap-1.5" : "p-4 gap-2"}`}>
                    {/* Category */}
                    {typeof product.category === "object" && product.category?.name && (
                        <span className={`${isHomeGrid ? "line-clamp-1 text-[9px] leading-none text-primary/65" : "text-[10px] text-[#C8102E]"} font-bold uppercase tracking-wider`}>
                            {product.category.name}
                        </span>
                    )}

                    {/* Title */}
                    <h3 className={`text-[#1A1A1A] font-bold line-clamp-2 group-hover:text-[#C8102E] transition-colors ${isHomeGrid ? "min-h-9 text-[13px] leading-[1.125rem] min-[430px]:text-sm md:min-h-10 md:text-[15px] md:leading-5" : "text-base leading-snug"}`}>
                        {product.title}
                    </h3>

                    {/* Color variant dots — interactive */}
                    {hasVariants && (
                        <div className={isHomeGrid ? "space-y-1" : "space-y-1.5"}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {product.variants!.slice(0, 6).map((v, index) => {
                                    const isSelected = selectedVariant?.id === v.id;
                                    const isOOS = v.stock === 0;
                                    return (
                                        <button
                                            key={v.id}
                                            title={v.color}
                                            onClick={(e) => handleSelectVariant(e, v)}
                                            disabled={isOOS}
                                            className={`relative rounded-full border-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${isHomeGrid ? "w-4 h-4" : "w-5 h-5"} ${
                                                isSelected
                                                    ? "border-[#C8102E] scale-110 shadow-sm"
                                                    : "border-gray-200 hover:border-gray-400 hover:scale-110"
                                            }`}
                                            style={{
                                                backgroundColor: v.colorHex || "#ccc",
                                                ...(colorWaveActive && !isOOS && {
                                                    animation: "card-color-wave 0.6s ease-in-out",
                                                    animationDelay: `${index * 60}ms`,
                                                    animationFillMode: "both",
                                                }),
                                            }}
                                        >
                                            {isSelected && (
                                                <span className="absolute inset-0 flex items-center justify-center">
                                                    <span className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                                                </span>
                                            )}
                                            {isOOS && (
                                                <span className="absolute inset-0 flex items-center justify-center rounded-full overflow-hidden">
                                                    <span className="w-[130%] h-px bg-gray-500/60 rotate-45 absolute" />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                                {product.variants!.length > 6 && (
                                    <span className="text-[10px] text-gray-400">+{product.variants!.length - 6}</span>
                                )}
                            </div>

                            {/* Color warning note */}
                            {showColorWarning && !selectedVariant && (
                                <p className="text-[10px] font-semibold text-amber-600 card-warning-in flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 shrink-0">
                                        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                                    </svg>
                                    {t("selectColorNote")}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Rating */}
                    {(!isHomeGrid || reviewCount > 0) && <div className={`flex items-center ${isHomeGrid ? "mt-0.5 gap-1" : "mt-auto gap-1.5"}`}>
                        <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    fill={i < Math.round(averageRating) ? "currentColor" : "none"}
                                    className={`${isHomeGrid ? "w-3 h-3" : "w-3.5 h-3.5"} ${i < Math.round(averageRating) ? "text-yellow-400" : "text-gray-300"}`}
                                />
                            ))}
                        </div>
                        {reviewCount > 0 && (
                            <span className={`${isHomeGrid ? "text-[10px]" : "text-xs"} text-gray-400 font-medium pt-0.5`}>({reviewCount})</span>
                        )}
                    </div>}

                    {/* Price & Mobile Add Button */}
                    <div className={`flex items-center justify-between ${isHomeGrid ? "mt-auto gap-2 pt-1.5" : "pt-2"}`}>
                        <div className="flex flex-col">
                            {resolved === null ? (
                                <span className="text-sm text-gray-400 italic">—</span>
                            ) : resolved.salePrice ? (
                                <>
                                    <span className={`${isHomeGrid ? "text-base leading-none md:text-lg" : "text-lg"} font-extrabold text-[#C8102E] tracking-tight`}>
                                        {formatResolvedPrice({ ...resolved, price: resolved.salePrice })}
                                    </span>
                                    <span className={`${isHomeGrid ? "mt-1 text-[10px] leading-none" : "text-xs"} text-gray-400 line-through`}>
                                        {formatResolvedPrice(resolved)}
                                    </span>
                                </>
                            ) : (
                                <span className={`${isHomeGrid ? "text-base leading-none md:text-lg" : "text-lg"} font-extrabold text-[#1A1A1A] tracking-tight`}>
                                    {formatResolvedPrice(resolved)}
                                </span>
                            )}
                        </div>

                        {/* Mobile Add Button */}
                        <button
                            onClick={handleAddToCart}
                            disabled={isAdding || !hasAnyStock}
                            className={`lg:hidden h-9 w-9 text-[#1A1A1A] rounded-full flex shrink-0 items-center justify-center active:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isHomeGrid ? "active:bg-transparent" : "bg-gray-100 active:bg-[#C8102E]"} ${cartButtonClass}`}
                        >
                            {isHomeGrid ? (
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 ring-1 ring-border/30 shadow-sm transition-colors active:bg-[#C8102E] md:h-9 md:w-9">
                                    {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin md:h-4 md:w-4" /> : <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                                </span>
                            ) : (
                                isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
