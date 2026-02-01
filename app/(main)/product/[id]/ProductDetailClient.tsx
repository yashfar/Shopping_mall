"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import StarRating from "@@/components/StarRating";
import { useCart } from "@@/context/CartContext";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, ShoppingCart, User, Loader2, Star, Minus, Plus } from "lucide-react";

interface ProductImage {
    id: string;
    url: string;
    createdAt: Date;
}

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
    };
}

interface Product {
    id: string;
    title: string;
    description: string | null;
    price: number;
    category: { name: string } | null;
    stock: number;
    thumbnail: string | null;
    images: ProductImage[];
    reviews: Review[];
}

interface ProductDetailClientProps {
    product: Product;
    averageRating: number;
    userReview: Review | null;
    isAuthenticated: boolean;
}

export default function ProductDetailClient({
    product,
    averageRating,
    userReview,
    isAuthenticated,
}: ProductDetailClientProps) {
    const { addToCart } = useCart();
    const router = useRouter();
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [quantity, setQuantity] = useState(1);

    // Use product images or fallback to thumbnail
    const displayImages =
        product.images.length > 0
            ? product.images
            : product.thumbnail
                ? [{ id: "thumbnail", url: product.thumbnail, createdAt: new Date() }]
                : [];

    const handlePreviousImage = () => {
        setSelectedImageIndex((prev) =>
            prev === 0 ? displayImages.length - 1 : prev - 1
        );
    };

    const handleNextImage = () => {
        setSelectedImageIndex((prev) =>
            prev === displayImages.length - 1 ? 0 : prev + 1
        );
    };

    const updateQuantity = (change: number) => {
        setQuantity((prev) => Math.min(Math.max(1, prev + change), product.stock));
    };

    const handleAddToCart = async () => {
        if (isAddingToCart) return;
        setIsAddingToCart(true);
        await addToCart(product.id, quantity);
        setIsAddingToCart(false);
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch("/api/review/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productId: product.id,
                    rating,
                    comment: comment.trim() || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || "Failed to submit review");
            }

            toast.success("Review submitted successfully!");
            setComment("");
            setRating(5);

            // Refresh the page to show new review
            setTimeout(() => {
                router.refresh();
            }, 1000);
        } catch (err: any) {
            toast.error(err.message || "Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getUserName = (user: Review["user"]) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        return user.email.split("@")[0];
    };

    return (
        <div className="bg-[#FAFAFA] min-h-screen pb-20 md:pb-12">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
                {/* Main Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mb-20">
                    {/* Left Column: Images */}
                    <div className="space-y-4">
                        <div className="sticky top-24 space-y-4">
                            {/* Main Image */}
                            <div className="relative aspect-[4/5] md:aspect-square w-full bg-white rounded-3xl overflow-hidden border border-[#A9A9A9]/20 shadow-sm group">
                                {displayImages.length > 0 ? (
                                    <>
                                        <Image
                                            src={displayImages[selectedImageIndex].url}
                                            alt={product.title}
                                            fill
                                            className="object-cover transition-transform duration-500 hover:scale-105 cursor-zoom-in"
                                            priority
                                        />

                                        {/* Navigation Arrows (Desktop Hover / Mobile Always) */}
                                        {displayImages.length > 1 && (
                                            <>
                                                <button
                                                    onClick={handlePreviousImage}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-[#C8102E] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <ChevronLeft className="w-6 h-6" />
                                                </button>
                                                <button
                                                    onClick={handleNextImage}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-[#C8102E] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <ChevronRight className="w-6 h-6" />
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                                        <div className="w-20 h-20 mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-medium">No image available</p>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {displayImages.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {displayImages.map((image, index) => (
                                        <button
                                            key={image.id}
                                            onClick={() => setSelectedImageIndex(index)}
                                            className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${selectedImageIndex === index
                                                ? "border-[#C8102E] ring-2 ring-[#C8102E]/20"
                                                : "border-transparent hover:border-gray-300"
                                                }`}
                                        >
                                            <Image
                                                src={image.url}
                                                alt={`${product.title} ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="flex flex-col">
                        {/* Category & Title */}
                        <div className="mb-6">
                            {product.category && (
                                <div className="inline-flex items-center px-3 py-1 bg-red-50 text-[#C8102E] text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                                    {product.category.name}
                                </div>
                            )}
                            <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] leading-tight mb-4">
                                {product.title}
                            </h1>

                            {/* Rating */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    <StarRating rating={averageRating} size="md" />
                                    <span className="text-lg font-bold text-[#1A1A1A] ml-2">
                                        {averageRating > 0 ? averageRating.toFixed(1) : "New"}
                                    </span>
                                </div>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <a href="#reviews" className="text-sm font-medium text-[#A9A9A9] hover:text-[#C8102E] underline underline-offset-4 transition-colors">
                                    {product.reviews.length} {product.reviews.length === 1 ? "review" : "reviews"}
                                </a>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="mb-8 p-6 bg-white border border-[#A9A9A9]/20 rounded-2xl shadow-sm">
                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-[#A9A9A9] uppercase tracking-wide">Total Price</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-[#1A1A1A]">
                                        ${(product.price / 100).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        {product.stock > 0 ? (
                            <div className="space-y-6">
                                {/* Quantity */}
                                <div className="flex items-center gap-6">
                                    <div className="w-32 flex items-center justify-between p-1 bg-white border border-[#A9A9A9] rounded-xl">
                                        <button
                                            onClick={() => updateQuantity(-1)}
                                            disabled={quantity <= 1}
                                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 text-[#1A1A1A] transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="font-bold text-lg text-[#1A1A1A]">{quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(1)}
                                            disabled={quantity >= 10 || quantity >= product.stock}
                                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 text-[#1A1A1A] transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="text-sm font-medium text-emerald-600 flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                        In Stock ({product.stock} available)
                                    </div>
                                </div>

                                {/* Add to Cart Button */}
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isAddingToCart}
                                    className="w-full py-4 bg-[#C8102E] hover:bg-[#A90D27] text-white rounded-xl font-black text-lg transition-all shadow-[0_4px_14px_rgba(200,16,46,0.3)] hover:shadow-[0_6px_20px_rgba(200,16,46,0.4)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    {isAddingToCart ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <ShoppingCart className="w-6 h-6" />
                                    )}
                                    {isAddingToCart ? "Adding..." : "Add to Cart"}
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-[#C8102E] font-bold flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Currently Out of Stock
                            </div>
                        )}

                        {/* Description */}
                        {product.description && (
                            <div className="mt-10 pt-10 border-t border-[#A9A9A9]/20">
                                <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Description</h3>
                                <div className="prose prose-sm md:prose-base text-gray-600 leading-relaxed max-w-none">
                                    <p className="whitespace-pre-line">{product.description}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reviews Section */}
                <div id="reviews" className="max-w-7xl mx-auto md:pt-20 border-t border-gray-100 mt-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">

                        {/* LEFT COLUMN: Summary & Form (Sticky on Desktop) */}
                        <div className="lg:col-span-4 space-y-10">
                            {/* Summary Header */}
                            <div>
                                <h2 className="text-3xl font-black text-[#1A1A1A] mb-2 tracking-tight">Customer Reviews</h2>
                                <div className="flex items-baseline gap-4 mb-6">
                                    <div className="text-4xl font-black text-[#1A1A1A]">{averageRating.toFixed(1)}</div>
                                    <div className="flex flex-col">
                                        <StarRating rating={averageRating} size="md" />
                                        <span className="text-sm font-medium text-gray-400 mt-1">
                                            Based on {product.reviews.length} reviews
                                        </span>
                                    </div>
                                </div>

                                {/* Rating Bars breakdown */}
                                {product.reviews.length > 0 && (
                                    <div className="space-y-3 mb-10">
                                        {[5, 4, 3, 2, 1].map((star) => {
                                            const count = product.reviews.filter(r => Math.round(r.rating) === star).length;
                                            const percent = (count / product.reviews.length) * 100;
                                            return (
                                                <div key={star} className="flex items-center gap-4 text-sm">
                                                    <div className="font-bold text-[#1A1A1A] w-3">{star}</div>
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#1A1A1A] rounded-full"
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>
                                                    <div className="w-8 text-right text-gray-400 font-medium">{percent > 0 ? `${Math.round(percent)}%` : '0%'}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Review Form */}
                            {isAuthenticated ? (
                                userReview ? (
                                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 text-emerald-800 flex flex-col gap-3">
                                        <div className="flex items-center gap-2 font-bold text-lg">
                                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            Review Submitted
                                        </div>
                                        <p className="text-sm text-emerald-700/80 leading-relaxed font-medium">
                                            Thank you! Your feedback helps others make better decisions.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-[0_8px_40px_rgba(0,0,0,0.04)] ring-4 ring-gray-50/50">
                                        <h3 className="font-bold text-xl text-[#1A1A1A] mb-6">Share your thoughts</h3>
                                        <form onSubmit={handleSubmitReview} className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rating</label>
                                                <div className="flex justify-center py-4 bg-gray-50 rounded-xl">
                                                    <StarRating
                                                        rating={rating}
                                                        size="xl"
                                                        interactive
                                                        onRatingChange={setRating}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="comment" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Review
                                                </label>
                                                <textarea
                                                    id="comment"
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    className="w-full p-4 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#1A1A1A] outline-none transition-all resize-none text-sm font-medium min-h-[120px]"
                                                    placeholder="What did you like or dislike?"
                                                    disabled={submitting}
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="w-full py-4 bg-[#1A1A1A] text-white rounded-xl font-bold hover:bg-[#C8102E] transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                                            >
                                                {submitting ? "Posting..." : "Post Review"}
                                            </button>
                                        </form>
                                    </div>
                                )
                            ) : (
                                <div className="bg-gray-50 rounded-3xl border border-gray-200 p-8 text-center space-y-4">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                        <User className="w-8 h-8 text-[#1A1A1A]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-[#1A1A1A]">Have this product?</p>
                                        <p className="text-sm text-gray-500">Sign in to share your experience with the community.</p>
                                    </div>
                                    <button
                                        onClick={() => router.push("/login")}
                                        className="w-full py-3 bg-white border-2 border-gray-200 text-[#1A1A1A] font-bold rounded-xl hover:border-[#1A1A1A] transition-all"
                                    >
                                        Log in to Review
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: Review List */}
                        <div className="lg:col-span-8">
                            <div className="space-y-6">
                                {product.reviews.length > 0 ? (
                                    product.reviews.map((review) => (
                                        <div key={review.id} className="group bg-white rounded-3xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-lg shadow-md ring-4 ring-gray-50">
                                                        {getUserName(review.user).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[#1A1A1A] text-lg">{getUserName(review.user)}</div>
                                                        <div className="text-xs font-medium text-gray-400 uppercase tracking-widest">{formatDate(review.createdAt)}</div>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                                    <StarRating rating={review.rating} size="sm" />
                                                </div>
                                            </div>

                                            {review.comment ? (
                                                <div className="relative">
                                                    <svg className="absolute -top-3 -left-2 w-8 h-8 text-gray-100 -z-10 transform -scale-x-100" fill="currentColor" viewBox="0 0 32 32">
                                                        <path d="M10 8v8h6v10h-10v-10h4v-8h-4zM24 8v8h6v10h-10v-10h4v-8h-4z"></path>
                                                    </svg>
                                                    <p className="text-gray-600 leading-relaxed text-lg font-medium">"{review.comment}"</p>
                                                </div>
                                            ) : (
                                                <p className="text-gray-400 italic">No written review</p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-24 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                                            <Star className="w-10 h-10 text-gray-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">No reviews yet</h3>
                                        <p className="text-gray-500 max-w-sm mx-auto">
                                            Be the first to share your thoughts on this product. Your feedback matters!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
