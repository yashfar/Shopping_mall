"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@@/context/CurrencyContext";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Leaf,
  ShoppingCart,
  Sparkles,
} from "lucide-react";

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
  variant: "bestSellers" | "newArrivals";
  linkHref?: string;
  linkText?: string;
}

export default function FeaturedProductsCarousel({
  title,
  products,
  variant,
  linkHref,
  linkText,
}: FeaturedProductsCarouselProps) {
  const t = useTranslations("featuredCarousel");
  const { formatPrice } = useCurrency();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
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
        scrollContainerRef.current.scrollLeft +
        (direction === "left" ? -scrollAmount : scrollAmount);

      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });

      // Check scroll after animation
      setTimeout(checkScroll, 300);
    }
  };

  if (products.length === 0) return null;

  const isBestSellers = variant === "bestSellers";
  const sectionLabel = isBestSellers ? t("bestSellerBadge") : t("newBadge");
  const sectionSubtitle = isBestSellers
    ? t("bestSellersSubtitle")
    : t("newArrivalsSubtitle");
  const SectionIcon = isBestSellers ? Crown : Leaf;

  return (
    <section
      className={`relative mx-auto my-3 w-[calc(100%_-_1rem)] max-w-[1400px] overflow-hidden rounded-3xl py-7 md:my-5 md:w-[calc(100%_-_2rem)] md:py-10 ${
        isBestSellers
          ? "bg-[url('/assets/home/best-sellers-background.png')] bg-cover bg-[position:58%_center] bg-no-repeat md:bg-center"
          : "bg-[url('/assets/home/new-arrivals-background.png')] bg-cover bg-[position:62%_center] bg-no-repeat shadow-sm"
      }`}
    >
      <div className="relative z-10 px-4 md:px-8 lg:px-10">
        <div className="mb-6 flex items-end justify-between gap-3 md:mb-8">
          <div className="min-w-0">
            <div
              className={`mb-2 inline-flex items-center gap-1.5 text-[0.65rem] font-black uppercase tracking-[0.16em] md:text-xs ${
                isBestSellers ? "text-primary" : "text-emerald-700"
              }`}
            >
              <SectionIcon className="h-4 w-4" aria-hidden="true" />
              <span>{sectionLabel}</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
              {title}
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={`h-0.5 w-10 shrink-0 rounded-full md:w-14 ${
                  isBestSellers ? "bg-primary" : "bg-emerald-700"
                }`}
                aria-hidden="true"
              />
              <p className="hidden text-sm text-muted-foreground sm:block">
                {sectionSubtitle}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 md:gap-4">
            {linkHref && (
              <Link
                href={linkHref}
                className={`inline-flex h-fit items-center gap-0.5 whitespace-nowrap text-[0.65rem] font-bold text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:gap-1 md:text-sm ${
                  isBestSellers ? "hover:text-primary" : "hover:text-emerald-700"
                }`}
              >
                {linkText || t("viewAll")}
                <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Link>
            )}
            <div className="flex gap-1.5 md:gap-2">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                aria-label={t("previousProducts")}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-background/80 shadow-sm transition-all hover:border-primary/20 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30 md:h-10 md:w-10"
              >
                <ChevronLeft className="h-4 w-4 text-foreground md:h-5 md:w-5" />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                aria-label={t("nextProducts")}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-background/80 shadow-sm transition-all hover:border-primary/20 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30 md:h-10 md:w-10"
              >
                <ChevronRight className="h-4 w-4 text-foreground md:h-5 md:w-5" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto px-1 pt-2 pb-4 snap-x snap-mandatory scrollbar-hide md:gap-6"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group w-[clamp(170px,52vw,200px)] flex-shrink-0 snap-start rounded-2xl transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:w-[220px] md:hover:-translate-y-1 lg:w-[240px]"
            >
              <div
                className={`relative mb-3 aspect-[3/4] overflow-hidden rounded-2xl border transition-shadow duration-300 ${
                  isBestSellers
                    ? "border-primary/5 bg-card shadow-sm group-hover:shadow-md"
                    : "border-border/10 bg-secondary"
                }`}
              >
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
                <span
                  className={`absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.625rem] font-black tracking-wide ${
                    isBestSellers
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-emerald-100 bg-emerald-50/90 text-emerald-900 backdrop-blur-sm"
                  }`}
                >
                  {!isBestSellers && (
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                  )}
                  {sectionLabel}
                </span>
                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold">
                      {t("outOfStock")}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-4 right-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="rounded-full border border-border/30 bg-background p-2 text-foreground shadow-md transition-colors hover:bg-primary hover:text-primary-foreground">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <h3
                className={`line-clamp-2 h-10 text-sm text-foreground transition-colors group-hover:text-primary md:h-12 md:text-base ${
                  isBestSellers ? "font-bold" : "font-semibold"
                }`}
              >
                {product.title}
              </h3>
              <div className="h-4">
                {product.category && (
                  <span className="block truncate text-xs font-medium text-muted-foreground">
                    {product.category.name}
                  </span>
                )}
              </div>
              <p
                className={`mt-2 text-foreground ${
                  isBestSellers ? "text-base font-black" : "text-sm font-bold"
                }`}
              >
                {formatPrice(product.price)}
              </p>
            </Link>
          ))}

          {/* View All Card */}
          {linkHref && (
            <Link
              href={linkHref}
              className={`flex w-[140px] flex-shrink-0 snap-start flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-background/50 text-muted-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:w-[160px] ${
                isBestSellers
                  ? "hover:border-primary hover:text-primary"
                  : "hover:border-emerald-600 hover:text-emerald-700"
              }`}
            >
              <span className="font-bold">{t("viewAll")}</span>
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
