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
                <div id="reviews" className="max-w-4xl mx-auto pt-16 border-t border-[#A9A9A9]/20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <h2 className="text-2xl font-black text-[#1A1A1A] flex items-center gap-3">
                                Customer Reviews
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-bold rounded-full">
                                    {product.reviews.length}
                                </span>
                            </h2>
                        </div>

                        {/* Summary Bar */}
                        {product.reviews.length > 0 && (
                            <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-xl border border-[#E5E5E5] shadow-sm">
                                <div className="text-center md:text-right">
                                    <div className="text-sm text-gray-400 font-bold uppercase tracking-wider">Average Rating</div>
                                    <div className="text-2xl font-black text-[#1A1A1A]">{averageRating.toFixed(1)} / 5</div>
                                </div>
                                <StarRating rating={averageRating} size="lg" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {/* Review Form - Left Side on Desktop */}
                        <div className="md:col-span-1">
                            {isAuthenticated ? (
                                userReview ? (
                                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-green-800">
                                        <div className="flex items-center gap-2 font-bold mb-2">
                                            <Check className="w-5 h-5" />
                                            Product Reviewed
                                        </div>
                                        <p className="text-sm text-green-700">
                                            Thanks for sharing your experience! Your review is live.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl border border-[#A9A9A9]/20 shadow-sm p-6 sticky top-24">
                                        <h3 className="font-bold text-lg text-[#1A1A1A] mb-4">Write a Review</h3>
                                        <form onSubmit={handleSubmitReview} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                                                <StarRating
                                                    rating={rating}
                                                    size="lg"
                                                    interactive
                                                    onRatingChange={setRating}
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Your Review (Optional)
                                                </label>
                                                <textarea
                                                    id="comment"
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    className="w-full p-3 rounded-xl border border-[#A9A9A9] focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E] outline-none transition-all resize-none text-sm"
                                                    rows={4}
                                                    placeholder="How was your experience?"
                                                    disabled={submitting}
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl font-bold hover:bg-[#C8102E] transition-colors disabled:opacity-70"
                                            >
                                                {submitting ? "Submitting..." : "Submit Review"}
                                            </button>
                                        </form>
                                    </div>
                                )
                            ) : (
                                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center">
                                    <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-900 font-bold mb-1">Want to review?</p>
                                    <p className="text-sm text-gray-500 mb-4">Please log in to share your thoughts.</p>
                                    <button
                                        onClick={() => router.push("/login")}
                                        className="w-full py-2.5 bg-white border border-[#A9A9A9] text-[#1A1A1A] font-bold rounded-xl hover:border-[#C8102E] hover:text-[#C8102E] transition-all"
                                    >
                                        Login
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Reviews List - Right Side on Desktop */}
                        <div className="md:col-span-2 space-y-6">
                            {product.reviews.length > 0 ? (
                                product.reviews.map((review) => (
                                    <div key={review.id} className="bg-white rounded-2xl border border-[#E5E5E5] p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center text-[#C8102E] font-black text-sm border border-red-100">
                                                    {getUserName(review.user).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-[#1A1A1A]">{getUserName(review.user)}</div>
                                                    <div className="text-xs text-gray-400">{formatDate(review.createdAt)}</div>
                                                </div>
                                            </div>
                                            <StarRating rating={review.rating} size="sm" />
                                        </div>
                                        {review.comment && (
                                            <p className="text-gray-600 leading-relaxed text-sm md:text-base">"{review.comment}"</p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-3xl border border-dashed border-gray-300">
                                    <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
                                        <Star className="w-8 h-8 text-yellow-400 fill-current" />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#1A1A1A]">No reviews yet</h3>
                                    <p className="text-gray-500 max-w-xs mt-1">
                                        Be the first to tell others about this product!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
