"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Heart,
  Home,
  Loader2,
  Maximize2,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import StarRating from "@@/components/StarRating";
import { useCart } from "@@/context/CartContext";
import { type PriceEntry, useCurrency } from "@@/context/CurrencyContext";
import { useWishlist } from "@@/context/WishlistContext";

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

interface ProductVariant {
  id: string;
  color: string;
  colorEn: string | null;
  colorHex: string | null;
  stock: number;
  images: string[];
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  salePrice?: number | null;
  prices?: PriceEntry[];
  category: { name: string; routeName: string } | null;
  stock: number;
  thumbnail: string | null;
  images: ProductImage[];
  reviews: Review[];
  variants: ProductVariant[];
  shippingDays?: string | null;
}

interface ProductDetailClientProps {
  product: Product;
  averageRating: number;
  userReview: Review | null;
  isAuthenticated: boolean;
}

type InformationSection = "description" | "details" | "shipping" | "reviews";

export default function ProductDetailClient({
  product,
  averageRating,
  userReview,
  isAuthenticated,
}: ProductDetailClientProps) {
  const { addToCart } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const { formatResolvedPrice, resolveProductPrice } = useCurrency();
  const router = useRouter();
  const t = useTranslations("productDetail");
  const locale = useLocale();
  const resolved = resolveProductPrice(product);
  const wishlisted = isWishlisted(product.id);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [stockAlertSubscribed, setStockAlertSubscribed] = useState(false);
  const [stockAlertLoading, setStockAlertLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );
  const [showColorWarning, setShowColorWarning] = useState(false);
  const [shakeCart, setShakeCart] = useState(false);
  const [colorWaveActive, setColorWaveActive] = useState(false);
  const [activeTab, setActiveTab] = useState<InformationSection>("description");
  const [mobileSection, setMobileSection] = useState<InformationSection | null>(
    "description",
  );
  const reviewsSectionRef = useRef<HTMLElement>(null);

  const hasVariants = product.variants.length > 0;
  const effectiveStock = selectedVariant
    ? selectedVariant.stock
    : product.stock;
  const hasAnyStock = hasVariants
    ? product.variants.some((variant) => variant.stock > 0)
    : product.stock > 0;

  useEffect(() => {
    if (effectiveStock === 0 && isAuthenticated) {
      fetch(`/api/stock-alert?productId=${product.id}`)
        .then((response) => response.json())
        .then((data) => setStockAlertSubscribed(data.subscribed))
        .catch(() => {});
    }
  }, [product.id, effectiveStock, isAuthenticated]);

  const variantImages: ProductImage[] = selectedVariant?.images.length
    ? selectedVariant.images.map((url, index) => ({
        id: `variant-${index}`,
        url,
        createdAt: new Date(),
      }))
    : [];

  const displayImages =
    variantImages.length > 0
      ? variantImages
      : product.images.length > 0
        ? product.images
        : product.thumbnail
          ? [{ id: "thumbnail", url: product.thumbnail, createdAt: new Date() }]
          : [];

  const selectedVariantName = selectedVariant
    ? locale === "en" && selectedVariant.colorEn
      ? selectedVariant.colorEn
      : selectedVariant.color
    : null;

  const informationSections: Array<{ key: InformationSection; label: string }> =
    [
      { key: "description", label: t("description") },
      { key: "details", label: t("productDetails") },
      { key: "shipping", label: t("shippingAndReturns") },
      { key: "reviews", label: t("customerReviews") },
    ];

  const handleReviewNavigation = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setActiveTab("reviews");
    } else {
      setMobileSection("reviews");
    }

    requestAnimationFrame(() => {
      reviewsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const toggleStockAlert = async () => {
    if (!isAuthenticated) {
      router.push("/register");
      return;
    }

    setStockAlertLoading(true);
    try {
      const response = await fetch("/api/stock-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await response.json();
      setStockAlertSubscribed(data.subscribed);
      toast.success(data.subscribed ? t("notifyMessage") : t("alertRemoved"));
    } catch {
      toast.error(t("failedToUpdateAlert"));
    } finally {
      setStockAlertLoading(false);
    }
  };

  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setSelectedImageIndex(0);
    setLightboxIndex(0);
    setQuantity(1);
    setShowColorWarning(false);
  };

  const handlePreviousImage = () => {
    setSelectedImageIndex((previous) =>
      previous === 0 ? displayImages.length - 1 : previous - 1,
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((previous) =>
      previous === displayImages.length - 1 ? 0 : previous + 1,
    );
  };

  const lightboxPrevious = () => {
    setLightboxIndex((previous) =>
      previous === 0 ? displayImages.length - 1 : previous - 1,
    );
  };

  const lightboxNext = () => {
    setLightboxIndex((previous) =>
      previous === displayImages.length - 1 ? 0 : previous + 1,
    );
  };

  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        setLightboxIndex((previous) =>
          previous === 0 ? displayImages.length - 1 : previous - 1,
        );
      }
      if (event.key === "ArrowRight") {
        setLightboxIndex((previous) =>
          previous === displayImages.length - 1 ? 0 : previous + 1,
        );
      }
      if (event.key === "Escape") setLightboxOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, displayImages.length]);

  const updateQuantity = (change: number) => {
    setQuantity((previous) =>
      Math.min(Math.max(1, previous + change), effectiveStock),
    );
  };

  const handleAddToCart = async () => {
    if (isAddingToCart) return;

    if (hasVariants && !selectedVariant) {
      setShowColorWarning(true);
      setShakeCart(true);
      setColorWaveActive(false);
      requestAnimationFrame(() => setColorWaveActive(true));
      setTimeout(() => setShakeCart(false), 500);
      setTimeout(() => setColorWaveActive(false), 1200);
      return;
    }

    setIsAddingToCart(true);
    const result = await addToCart(
      product.id,
      quantity,
      selectedVariant?.id ?? undefined,
    );
    if (result === "unauthorized") router.push("/register");
    setIsAddingToCart(false);
  };

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/review/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          rating,
          comment: comment.trim() || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || t("reviewSubmitFailed"));
      }

      toast.success(t("reviewSubmitSuccess"));
      setComment("");
      setRating(5);
      setTimeout(() => router.refresh(), 1000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("reviewSubmitFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getUserName = (user: Review["user"]) => {
    if (user.firstName && user.lastName)
      return `${user.firstName} ${user.lastName}`;
    return user.email.split("@")[0];
  };

  const renderRatingSummary = () => (
    <div className="rounded-[20px] border border-[#eadfd3] bg-white p-5 shadow-[0_10px_30px_rgba(83,59,35,0.05)] sm:p-6">
      <h2 className="text-base md:text-lg font-extrabold text-[#171717]">
        {t("customerReviews")}
      </h2>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-3xl md:text-4xl font-black tracking-tight text-[#171717]">
          {averageRating.toFixed(1)}
        </span>
        <div>
          <StarRating rating={averageRating} size="md" />
          <p className="mt-1 text-xs font-medium text-[#8e8a84]">
            {t("basedOnReviews", { count: product.reviews.length })}
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = product.reviews.filter(
            (review) => Math.round(review.rating) === star,
          ).length;
          const percentage = product.reviews.length
            ? (count / product.reviews.length) * 100
            : 0;

          return (
            <div key={star} className="flex items-center gap-3 text-xs">
              <span className="w-3 font-bold text-[#3d3935]">{star}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eee9e3]">
                <div
                  className="h-full rounded-full bg-[#c8102e] transition-[width] duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-9 text-right font-medium text-[#98928c]">
                {Math.round(percentage)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderReviewAction = () => {
    if (isAuthenticated && userReview) {
      return (
        <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/70 p-5 text-emerald-800">
          <div className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-4 w-4" />
            </span>
            {t("reviewSubmitted")}
          </div>
          <p className="mt-3 text-sm leading-6 text-emerald-700/80">
            {t("reviewThankYou")}
          </p>
        </div>
      );
    }

    if (isAuthenticated) {
      return (
        <form
          onSubmit={handleSubmitReview}
          className="rounded-[20px] border border-[#eadfd3] bg-white p-5 shadow-[0_10px_30px_rgba(83,59,35,0.04)]"
        >
          <h3 className="text-base font-extrabold text-[#171717]">
            {t("shareThoughts")}
          </h3>
          <div className="mt-4 rounded-xl bg-[#faf7f3] p-3">
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRatingChange={setRating}
            />
          </div>
          <label
            htmlFor="comment"
            className="mt-4 block text-xs font-bold text-[#625d57]"
          >
            {t("reviewLabel")}
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="mt-2 min-h-24 w-full resize-none rounded-xl border border-[#e7ddd3] bg-[#fcfaf8] p-3 text-sm outline-none transition focus:border-[#c8102e] focus:ring-2 focus:ring-[#c8102e]/10"
            placeholder={t("reviewPlaceholder")}
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 w-full rounded-xl bg-[#171717] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#c8102e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? t("posting") : t("postReview")}
          </button>
        </form>
      );
    }

    return (
      <div className="rounded-[20px] border border-[#eadfd3] bg-[#faf7f3] p-5 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#6d5a48] shadow-sm">
          <User className="h-5 w-5" />
        </span>
        <p className="mt-3 font-bold text-[#171717]">{t("haveThisProduct")}</p>
        <p className="mt-1 text-sm leading-5 text-[#77716b]">
          {t("signInToReview")}
        </p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mt-4 w-full rounded-xl border border-[#d8c9ba] bg-white px-4 py-2.5 text-sm font-bold text-[#2a2521] transition hover:border-[#c8102e] hover:text-[#c8102e]"
        >
          {t("logInToReview")}
        </button>
      </div>
    );
  };

  const renderReviewList = () =>
    product.reviews.length > 0 ? (
      <div className="space-y-3">
        {product.reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-2xl border border-[#eee5dc] bg-white p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4ece4] font-bold text-[#6d5138]">
                  {getUserName(review.user).charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#24211e]">
                    {getUserName(review.user)}
                  </p>
                  <p className="text-xs text-[#98918a]">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              </div>
              <StarRating rating={review.rating} size="sm" />
            </div>
            <p
              className={`mt-3 text-sm leading-6 ${review.comment ? "text-[#5f5a55]" : "italic text-[#aaa39c]"}`}
            >
              {review.comment || t("noWrittenReview")}
            </p>
          </article>
        ))}
      </div>
    ) : (
      <div className="rounded-2xl border border-dashed border-[#dfd4c8] bg-[#fcfaf8] px-5 py-10 text-center">
        <Star className="mx-auto h-8 w-8 text-[#d2c5b8]" />
        <h3 className="mt-3 font-bold text-[#24211e]">{t("noReviews")}</h3>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#817a73]">
          {t("noReviewsDescription")}
        </p>
      </div>
    );

  const renderInformationContent = (section: InformationSection) => {
    if (section === "description") {
      return product.description ? (
        <div>
          <h3 className="text-lg font-extrabold text-[#24211e]">
            {t("productDescription")}
          </h3>
          <p className="mt-3 whitespace-pre-line text-sm md:leading-7 text-[#68615b] sm:text-base">
            {product.description}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[#8f8881]">{t("noDescription")}</p>
      );
    }

    if (section === "details") {
      return (
        <dl className="grid gap-3 sm:grid-cols-2">
          {product.category && (
            <div className="rounded-xl bg-[#faf7f3] p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-[#9b8e82]">
                {t("category")}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[#302b27]">
                {product.category.name}
              </dd>
            </div>
          )}
          <div className="rounded-xl bg-[#faf7f3] p-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-[#9b8e82]">
              {t("availability")}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#302b27]">
              {hasAnyStock ? t("inStock") : t("currentlyOutOfStock")}
            </dd>
          </div>
          {hasVariants && (
            <div className="rounded-xl bg-[#faf7f3] p-4 sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wider text-[#9b8e82]">
                {t("availableColors")}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[#302b27]">
                {product.variants
                  .map((variant) =>
                    locale === "en" && variant.colorEn
                      ? variant.colorEn
                      : variant.color,
                  )
                  .join(", ")}
              </dd>
            </div>
          )}
        </dl>
      );
    }

    if (section === "shipping") {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#eee5dc] bg-[#fcfaf8] p-4">
            <Truck className="h-5 w-5 text-[#b15e2d]" />
            <h3 className="mt-3 font-bold text-[#2b2723]">
              {t("shippingInformation")}
            </h3>
            <p className="mt-1 text-sm leading-6 text-[#746d67]">
              {product.shippingDays
                ? t("estimatedShippingDays", { days: product.shippingDays })
                : t("shippingPolicySummary")}
            </p>
            <Link
              href="/shipping"
              className="mt-3 inline-flex text-sm font-bold text-[#c8102e] hover:underline"
            >
              {t("viewShippingPolicy")}
            </Link>
          </div>
          <div className="rounded-2xl border border-[#eee5dc] bg-[#fcfaf8] p-4">
            <RotateCcw className="h-5 w-5 text-[#b15e2d]" />
            <h3 className="mt-3 font-bold text-[#2b2723]">
              {t("returnsInformation")}
            </h3>
            <p className="mt-1 text-sm leading-6 text-[#746d67]">
              {t("returnsPolicySummary")}
            </p>
            <Link
              href="/returns"
              className="mt-3 inline-flex text-sm font-bold text-[#c8102e] hover:underline"
            >
              {t("viewReturnsPolicy")}
            </Link>
          </div>
        </div>
      );
    }

    return renderReviewList();
  };

  return (
    <>
      <style>{`
        @keyframes product-cart-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .product-cart-shake { animation: product-cart-shake 0.45s ease-in-out; }
        @keyframes product-color-wave {
          0%, 100% { transform: translateY(0); }
          35% { transform: translateY(-5px); }
          65% { transform: translateY(2px); }
        }
      `}</style>

      <main className="min-h-screen bg-[#f8f5f0] pb-14 text-[#24211e] sm:pb-20">
        <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)] lg:gap-8 xl:gap-10">
            <section aria-label={t("productGallery")} className="min-w-0">
              <div className="mx-auto w-[90%] sm:w-[92%] lg:sticky lg:top-24 lg:mx-0 w-full lg:w-[94%]">
                <div className="group relative aspect-[4/3] overflow-hidden rounded-[20px] border border-[#eadfd3] bg-white shadow-[0_14px_40px_rgba(75,54,33,0.07)] lg:aspect-[1.08/1]">
                  {displayImages.length > 0 ? (
                    <>
                      <Image
                        src={displayImages[selectedImageIndex].url}
                        alt={product.title}
                        fill
                        priority
                        sizes="(max-width: 1023px) 100vw, 56vw"
                        className="cursor-zoom-in object-cover transition-transform duration-500 group-hover:scale-[1.015]"
                        onClick={() => {
                          setLightboxIndex(selectedImageIndex);
                          setLightboxOpen(true);
                        }}
                      />
                      {displayImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={handlePreviousImage}
                            aria-label={t("previousImage")}
                            className="absolute left-3 top-1/2 flex h-8 w-8 md:h-10 md:w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/20 text-[#292521] shadow-lg backdrop-blur transition hover:bg-white lg:opacity-0 lg:group-hover:opacity-100"
                          >
                            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 " />
                          </button>
                          <button
                            type="button"
                            onClick={handleNextImage}
                            aria-label={t("nextImage")}
                            className="absolute right-3 top-1/2 flex h-8 w-8 md:h-10 md:w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/20 text-[#292521] shadow-lg backdrop-blur transition hover:bg-white lg:opacity-0 lg:group-hover:opacity-100"
                          >
                            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setLightboxIndex(selectedImageIndex);
                          setLightboxOpen(true);
                        }}
                        aria-label={t("openFullscreen")}
                        className="absolute bottom-3 right-3 flex  h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full border border-white/70 bg-white/20 text-[#292521] shadow-lg backdrop-blur transition hover:bg-white"
                      >
                        <Maximize2 className="h-4 w-4 md:h-5 md:w-5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center bg-[#fbfaf8] text-[#b5ada5]">
                      <PackageCheck className="h-14 w-14" strokeWidth={1.2} />
                      <p className="mt-3 text-sm font-semibold">
                        {t("noImageAvailable")}
                      </p>
                    </div>
                  )}
                </div>

                {displayImages.length > 1 && (
                  <div className="mt-3 flex max-w-full gap-2.5 overflow-x-auto pb-1.5 sm:mt-4 sm:gap-3">
                    {displayImages.map((image, index) => (
                      <button
                        type="button"
                        key={image.id}
                        onClick={() => setSelectedImageIndex(index)}
                        aria-label={t("selectImage", { number: index + 1 })}
                        aria-current={
                          selectedImageIndex === index ? "true" : undefined
                        }
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition sm:h-[78px] sm:w-[78px] ${
                          selectedImageIndex === index
                            ? "border-[#c8102e] shadow-[0_0_0_2px_rgba(200,16,46,0.1)]"
                            : "border-transparent hover:border-[#d7ccc1]"
                        }`}
                      >
                        <Image
                          src={image.url}
                          alt={`${product.title} ${index + 1}`}
                          fill
                          sizes="78px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="min-w-0 lg:pt-1">
              <nav
                aria-label={t("breadcrumbLabel")}
                className="mb-4 hidden min-w-0 items-center gap-1.5 text-xs text-[#99918a] sm:flex"
              >
                <Link
                  href="/"
                  className="transition hover:text-[#c8102e]"
                  aria-label={t("home")}
                >
                  <Home className="h-3.5 w-3.5" />
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <Link
                  href="/products"
                  className="shrink-0 transition hover:text-[#c8102e]"
                >
                  {t("products")}
                </Link>
                {product.category && (
                  <>
                    <ChevronRight className="h-3 w-3 shrink-0" />
                    <Link
                      href={`/category/${encodeURIComponent(product.category.routeName)}`}
                      className="truncate transition hover:text-[#c8102e]"
                    >
                      {product.category.name}
                    </Link>
                  </>
                )}
              </nav>

              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  {product.category && (
                    <span className="inline-flex max-w-full rounded-full bg-[#fde9e8] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#c8102e]">
                      <span className="truncate">{product.category.name}</span>
                    </span>
                  )}
                  <h1 className="mt-3 text-[20px] font-black leading-[1.08] tracking-[-0.035em] text-[#171717] sm:text-[27px] xl:text-[28px]">
                    {product.title}
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(product.id)}
                  aria-label={
                    wishlisted ? t("removeFromWishlist") : t("addToWishlist")
                  }
                  aria-pressed={wishlisted}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-white transition sm:h-12 sm:w-12 ${
                    wishlisted
                      ? "border-[#c8102e] text-[#c8102e]"
                      : "border-[#e6ddd4] text-[#3f3a35] hover:border-[#c8102e] hover:text-[#c8102e]"
                  }`}
                >
                  <Heart
                    className={`h-5 w-5 ${wishlisted ? "fill-current" : ""}`}
                  />
                </button>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                <div className="[&_svg]:h-[18px] [&_svg]:w-[18px] sm:[&_svg]:h-5 sm:[&_svg]:w-5">
                  <StarRating rating={averageRating} size="md" />
                </div>
                <span className="text-sm font-bold text-[#292521] sm:text-base">
                  {averageRating > 0 ? averageRating.toFixed(1) : t("new")}
                </span>
                <span className="h-1 w-1 rounded-full bg-[#c9c0b8]" />
                <button
                  type="button"
                  onClick={handleReviewNavigation}
                  aria-controls="reviews"
                  className="text-xs font-medium text-[#8f8881] underline-offset-4 hover:text-[#c8102e] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8102e] focus-visible:ring-offset-2 sm:text-sm"
                >
                  {product.reviews.length}{" "}
                  {product.reviews.length === 1 ? t("review") : t("reviews")}
                </button>
              </div>

              {product.description && (
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#6f6862] sm:text-[15px]">
                  {product.description}
                </p>
              )}

              {hasVariants && (
                <div className="mt-5 border-t border-[#eee5dc] pt-5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-[#38332f]">
                      {t("color")}:
                    </span>
                    <span
                      className={
                        selectedVariantName
                          ? "font-semibold text-[#38332f]"
                          : "text-[#99918a]"
                      }
                    >
                      {selectedVariantName || t("selectColor")}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.variants.map((variant, index) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const isOutOfStock = variant.stock === 0;
                      const variantName =
                        locale === "en" && variant.colorEn
                          ? variant.colorEn
                          : variant.color;

                      return (
                        <button
                          type="button"
                          key={variant.id}
                          onClick={() =>
                            !isOutOfStock && handleSelectVariant(variant)
                          }
                          disabled={isOutOfStock}
                          aria-label={`${variantName}, ${isOutOfStock ? t("currentlyOutOfStock") : t("variantStock", { count: variant.stock })}`}
                          aria-pressed={isSelected}
                          className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8102e] focus-visible:ring-offset-2 disabled:cursor-not-allowed"
                          style={
                            colorWaveActive
                              ? {
                                  animation:
                                    "product-color-wave 0.6s ease-in-out",
                                  animationDelay: `${index * 60}ms`,
                                  animationFillMode: "both",
                                }
                              : undefined
                          }
                        >
                          <span
                            className={`relative block h-8 w-8 rounded-full border-[3px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)] transition ${
                              isSelected
                                ? "scale-105 border-[#c8102e] ring-2 ring-[#c8102e]/15 ring-offset-1"
                                : "border-white ring-1 ring-[#d8d0c8]"
                            } ${isOutOfStock ? "opacity-35" : ""}`}
                            style={{
                              backgroundColor: variant.colorHex || "#d8d0c8",
                            }}
                          >
                            {isOutOfStock && (
                              <span className="absolute left-1/2 top-1/2 h-px w-9 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#7b746d]" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {!selectedVariant && (
                    <p
                      className={`mt-2 text-xs font-medium ${showColorWarning ? "text-amber-700" : "text-[#9c958e]"}`}
                    >
                      {t("selectColorFirst")}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 rounded-[20px] border border-[#e8ded4] bg-white p-3.5 shadow-[0_12px_35px_rgba(79,57,36,0.06)] sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    {resolved === null ? (
                      <span className="text-2xl font-bold text-[#aaa39c]">
                        —
                      </span>
                    ) : resolved.salePrice !== null ? (
                      <>
                        <span className="text-[25px] font-black tracking-[-0.03em] text-[#171717] sm:text-3xl">
                          {formatResolvedPrice({
                            ...resolved,
                            price: resolved.salePrice,
                          })}
                        </span>
                        <span className="text-base font-medium text-[#aaa39c] line-through">
                          {formatResolvedPrice(resolved)}
                        </span>
                        {resolved.price > 0 && (
                          <span className="rounded-full bg-[#fde9e8] px-2 py-1 text-xs font-extrabold text-[#c8102e]">
                            -
                            {Math.round(
                              (1 - resolved.salePrice / resolved.price) * 100,
                            )}
                            %
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[25px] font-black tracking-[-0.03em] text-[#171717] sm:text-3xl">
                        {formatResolvedPrice(resolved)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-bold ${hasAnyStock ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-[#c8102e]"}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${hasAnyStock ? "bg-emerald-500" : "bg-[#c8102e]"}`}
                    />
                    {hasAnyStock
                      ? selectedVariant || !hasVariants
                        ? t("inStockAvailable", { count: effectiveStock })
                        : t("inStock")
                      : t("currentlyOutOfStock")}
                  </span>
                </div>

                {product.shippingDays && (
                  <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-[#f6f1eb] px-3.5 py-2.5 text-sm text-[#4b443e]">
                    <Truck className="h-4 w-4 shrink-0" />
                    <span className="font-medium text-xs md:text-sm">
                      {t("estimatedShippingDays", {
                        days: product.shippingDays,
                      })}
                    </span>
                  </div>
                )}

                {hasAnyStock ? (
                  <div className="mt-3">
                    {(!hasVariants || selectedVariant) && (
                      <div className="mb-2.5 flex h-12 w-[138px] items-center rounded-xl border border-[#dfd4c8] bg-[#fcfaf8] p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(-1)}
                          disabled={quantity <= 1}
                          aria-label={t("decreaseQuantity")}
                          className="flex h-10 w-10 items-center justify-center rounded-lg transition hover:bg-white disabled:opacity-30"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-10 flex-1 text-center font-bold">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(1)}
                          disabled={
                            quantity >= 10 || quantity >= effectiveStock
                          }
                          aria-label={t("increaseQuantity")}
                          className="flex h-10 w-10 items-center justify-center rounded-lg transition hover:bg-white disabled:opacity-30"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isAddingToCart}
                        className={`flex h-12 min-w-0 flex-1 items-center justify-center gap-2.5 rounded-xl bg-[#c8102e] px-5 text-base font-extrabold text-white shadow-[0_8px_18px_rgba(200,16,46,0.2)] transition hover:bg-[#ab0d27] disabled:cursor-not-allowed disabled:opacity-65 ${shakeCart ? "product-cart-shake" : ""}`}
                      >
                        {isAddingToCart ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <ShoppingCart className="h-5 w-5" />
                        )}
                        {isAddingToCart ? t("adding") : t("addToCart")}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggle(product.id)}
                        aria-label={
                          wishlisted
                            ? t("removeFromWishlist")
                            : t("addToWishlist")
                        }
                        aria-pressed={wishlisted}
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8102e] focus-visible:ring-offset-2 ${
                          wishlisted
                            ? "border-[#c8102e] bg-[#fff7f7] text-[#c8102e]"
                            : "border-[#e1d6cc] text-[#c8102e] hover:border-[#c8102e]"
                        }`}
                      >
                        <Heart
                          className={`h-5 w-5 ${wishlisted ? "fill-current" : ""}`}
                        />
                      </button>
                    </div>

                    {showColorWarning && hasVariants && !selectedVariant && (
                      <p
                        role="alert"
                        className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-700"
                      >
                        {t("selectColorNote")}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={toggleStockAlert}
                      disabled={stockAlertLoading}
                      className={`flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border font-bold transition ${stockAlertSubscribed ? "border-amber-400 bg-amber-50 text-amber-700" : "border-[#e1d6cc] text-[#5c554f] hover:border-amber-400 hover:text-amber-700"}`}
                    >
                      <Bell
                        className={`h-4 w-4 ${stockAlertSubscribed ? "fill-current" : ""}`}
                      />
                      {stockAlertLoading
                        ? "…"
                        : stockAlertSubscribed
                          ? t("youllBeNotified")
                          : t("notifyWhenAvailable")}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(product.id)}
                      aria-label={
                        wishlisted
                          ? t("removeFromWishlist")
                          : t("addToWishlist")
                      }
                      aria-pressed={wishlisted}
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8102e] focus-visible:ring-offset-2 ${wishlisted ? "border-[#c8102e] bg-[#fff7f7] text-[#c8102e]" : "border-[#e1d6cc] text-[#5c554f] hover:border-[#c8102e] hover:text-[#c8102e]"}`}
                    >
                      <Heart
                        className={`h-5 w-5 ${wishlisted ? "fill-current" : ""}`}
                      />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-2.5 grid grid-cols-2 overflow-hidden rounded-[18px] border border-[#eadfd3] bg-[#fbf8f4] sm:grid-cols-4">
                {[
                  {
                    icon: Truck,
                    title: t("shipping"),
                    body: product.shippingDays
                      ? t("shippingDaysShort", { days: product.shippingDays })
                      : t("viewPolicy"),
                  },
                  {
                    icon: ShieldCheck,
                    title: t("securePayment"),
                    body: t("securePaymentShort"),
                  },
                  {
                    icon: RotateCcw,
                    title: t("returnsInformation"),
                    body: t("viewPolicy"),
                  },
                  {
                    icon: Headphones,
                    title: t("customerSupport"),
                    body: t("contactOptions"),
                  },
                ].map(({ icon: Icon, title, body }, index) => (
                  <div
                    key={title}
                    className={`flex min-w-0 flex-col items-center px-2 py-2.5 text-center ${index % 2 !== 0 ? "border-l border-[#eadfd3]" : ""} ${index > 1 ? "border-t border-[#eadfd3] sm:border-t-0" : ""} ${index === 2 ? "sm:border-l" : ""}`}
                  >
                    <Icon
                      className="h-[18px] w-[18px] text-[#b15e2d]"
                      strokeWidth={1.7}
                    />
                    <span className="mt-1 text-[11px] font-bold text-[#3d3833]">
                      {title}
                    </span>
                    <span className="mt-0.5 truncate text-[10px] text-[#968e87]">
                      {body}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section
            ref={reviewsSectionRef}
            id="reviews"
            className="mt-8 scroll-mt-24 lg:mt-12"
          >
            <div className="hidden items-start grid-cols-[minmax(0,2fr)_minmax(300px,0.8fr)] gap-5 lg:grid">
              <div className="h-full min-w-0 self-start rounded-[22px] border border-[#e8ded4] bg-white p-5 shadow-[0_12px_35px_rgba(79,57,36,0.04)] xl:p-6">
                <div
                  role="tablist"
                  aria-label={t("productInformation")}
                  className="flex gap-7 overflow-x-auto border-b border-[#eee5dc]"
                >
                  {informationSections.map((section) => (
                    <button
                      type="button"
                      role="tab"
                      key={section.key}
                      id={`product-tab-${section.key}`}
                      aria-selected={activeTab === section.key}
                      aria-controls={`product-panel-${section.key}`}
                      onClick={() => setActiveTab(section.key)}
                      className={`relative whitespace-nowrap pb-3 text-sm font-bold transition ${activeTab === section.key ? "text-[#c8102e] after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-[#c8102e]" : "text-[#5f5953] hover:text-[#24211e]"}`}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
                <div
                  role="tabpanel"
                  id={`product-panel-${activeTab}`}
                  aria-labelledby={`product-tab-${activeTab}`}
                  className="pt-6"
                >
                  {renderInformationContent(activeTab)}
                </div>
              </div>

              <aside className="space-y-4 self-start">
                {renderRatingSummary()}
                {renderReviewAction()}
              </aside>
            </div>

            <div className="overflow-hidden rounded-[20px] border border-[#e8ded4] bg-white lg:hidden">
              {informationSections.map((section) => {
                const isOpen = mobileSection === section.key;
                return (
                  <div
                    key={section.key}
                    className="border-b border-[#eee5dc] last:border-b-0"
                  >
                    <h2>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`mobile-product-panel-${section.key}`}
                        onClick={() =>
                          setMobileSection(isOpen ? null : section.key)
                        }
                        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-extrabold text-[#2c2824] sm:px-5"
                      >
                        {section.label}
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180 text-[#c8102e]" : "text-[#918980]"}`}
                        />
                      </button>
                    </h2>
                    {isOpen && (
                      <div
                        id={`mobile-product-panel-${section.key}`}
                        className="px-4 pb-5 sm:px-5"
                      >
                        {section.key === "reviews" ? (
                          <div className="space-y-4">
                            {renderRatingSummary()}
                            {renderReviewAction()}
                            {renderReviewList()}
                          </div>
                        ) : (
                          renderInformationContent(section.key)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {lightboxOpen && displayImages.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("imageViewer")}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label={t("closeImageViewer")}
            className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          {displayImages.length > 1 && (
            <span className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-sm text-white">
              {lightboxIndex + 1} / {displayImages.length}
            </span>
          )}
          <div
            className="relative h-[82vh] w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={displayImages[lightboxIndex].url}
              alt={`${product.title} ${lightboxIndex + 1}`}
              fill
              priority
              sizes="100vw"
              className="object-contain"
            />
          </div>
          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  lightboxPrevious();
                }}
                aria-label={t("previousImage")}
                className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-5"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  lightboxNext();
                }}
                aria-label={t("nextImage")}
                className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-5"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
