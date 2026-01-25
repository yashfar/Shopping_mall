"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import StarRating from "@@/components/StarRating";
import { useCart } from "@@/context/CartContext";
import { toast } from "sonner";
import "./product-detail.css";

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
        setQuantity((prev) => Math.min(Math.max(1, prev + change), 10));
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
            }, 1500);
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
        <div className="product-detail-container relative">
            <div className="product-detail-grid">
                {/* Image Carousel Section */}
                <div className="image-section">
                    {displayImages.length > 0 ? (
                        <>
                            <div className="main-image-container">
                                <Image
                                    src={displayImages[selectedImageIndex].url}
                                    alt={product.title}
                                    width={600}
                                    height={600}
                                    className="main-image"
                                    priority
                                />
                                {displayImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePreviousImage}
                                            className="carousel-btn carousel-btn-prev"
                                            aria-label="Previous image"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                                stroke="currentColor"
                                                className="w-6 h-6"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15.75 19.5L8.25 12l7.5-7.5"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleNextImage}
                                            className="carousel-btn carousel-btn-next"
                                            aria-label="Next image"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                                stroke="currentColor"
                                                className="w-6 h-6"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                                                />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Thumbnail Navigation */}
                            {displayImages.length > 1 && (
                                <div className="thumbnail-grid">
                                    {displayImages.map((image, index) => (
                                        <button
                                            key={image.id}
                                            onClick={() => setSelectedImageIndex(index)}
                                            className={`thumbnail-btn ${selectedImageIndex === index ? "active" : ""
                                                }`}
                                        >
                                            <Image
                                                src={image.url}
                                                alt={`${product.title} ${index + 1}`}
                                                width={100}
                                                height={100}
                                                className="thumbnail-image"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="no-image-placeholder">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-24 h-24 text-gray-300"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                                />
                            </svg>
                            <p>No image available</p>
                        </div>
                    )}
                </div>

                {/* Product Info Section */}
                <div className="info-section">
                    <div className="product-header">
                        {product.category && (
                            <span className="category-badge">{product.category.name}</span>
                        )}
                        <h1 className="product-title">{product.title}</h1>

                        <div className="rating-container">
                            <StarRating rating={averageRating} size="md" />
                            <span className="rating-text">
                                {averageRating > 0 ? averageRating.toFixed(1) : "No ratings"}
                            </span>
                            <span className="review-count">
                                ({product.reviews.length}{" "}
                                {product.reviews.length === 1 ? "review" : "reviews"})
                            </span>
                        </div>

                        <div className="price-container">
                            <span className="price">${(product.price / 100).toFixed(2)}</span>
                        </div>

                        {product.stock > 0 ? (
                            <div className="flex flex-col gap-6 mt-6">
                                <div className="stock-badge in-stock">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="w-5 h-5"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    In Stock ({product.stock} available)
                                </div>

                                <div className="quantity-selector">
                                    <span className="font-bold text-[#1A1A1A] text-lg">Quantity</span>
                                    <div className="quantity-controls">
                                        <button
                                            onClick={() => updateQuantity(-1)}
                                            className="quantity-btn"
                                            disabled={quantity <= 1}
                                        >
                                            −
                                        </button>
                                        <span className="quantity-value">{quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(1)}
                                            className="quantity-btn"
                                            disabled={quantity >= 10 || quantity >= product.stock}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    disabled={isAddingToCart}
                                    className="add-to-cart-btn"
                                >
                                    {isAddingToCart ? (
                                        <>
                                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                            Adding to Cart...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                            </svg>
                                            Add to Cart
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="stock-badge out-of-stock mt-6">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                </svg>
                                Out of Stock
                            </div>
                        )}
                    </div>

                    {product.description && (
                        <div className="description-section">
                            <h2 className="section-title">Description</h2>
                            <p className="description-text">{product.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Reviews Section */}
            <div className="reviews-section">
                <h2 className="section-title-large">Customer Reviews</h2>

                {/* Add Review Form */}
                {isAuthenticated ? (
                    userReview ? (
                        <div className="already-reviewed">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>You already reviewed this product.</span>
                        </div>
                    ) : (
                        <div className="review-form-container">
                            <h3 className="form-title">Write a Review</h3>

                            <form onSubmit={handleSubmitReview} className="review-form">
                                <div className="form-group">
                                    <label className="form-label">Your Rating</label>
                                    <StarRating
                                        rating={rating}
                                        size="lg"
                                        interactive
                                        onRatingChange={setRating}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="comment" className="form-label">
                                        Your Review (Optional)
                                    </label>
                                    <textarea
                                        id="comment"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="form-textarea"
                                        rows={4}
                                        placeholder="Share your experience with this product..."
                                        disabled={submitting}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn-submit-review"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner"></span>
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Review"
                                    )}
                                </button>
                            </form>
                        </div>
                    )
                ) : (
                    <div className="login-prompt">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                            />
                        </svg>
                        <p>Please login to write a review</p>
                        <button
                            onClick={() => router.push("/login")}
                            className="btn-login"
                        >
                            Login
                        </button>
                    </div>
                )}

                {/* Review List */}
                <div className="reviews-list">
                    {product.reviews.length > 0 ? (
                        product.reviews.map((review) => (
                            <div key={review.id} className="review-card">
                                <div className="review-header">
                                    <div className="reviewer-info">
                                        <div className="reviewer-avatar">
                                            {getUserName(review.user).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="reviewer-name">
                                                {getUserName(review.user)}
                                            </div>
                                            <div className="review-date">
                                                {formatDate(review.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                    <StarRating rating={review.rating} size="sm" />
                                </div>
                                {review.comment && (
                                    <p className="review-comment">{review.comment}</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="no-reviews">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-16 h-16 text-gray-300"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                                />
                            </svg>
                            <p>No reviews yet.</p>
                            <p className="no-reviews-subtitle">
                                Be the first to review this product!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
