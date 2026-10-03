import { prisma } from "@/lib/prisma";
import ProductCatalog from "@@/components/ProductCatalog";
import BannerCarousel from "@@/components/BannerCarousel";
import FeaturedProductsCarousel from "@@/components/FeaturedProductsCarousel";
import { getTranslations, getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import type { SupportedCurrency } from "@@/lib/format-price";
import { parsePriceFilterAmount } from "@@/lib/product-price-filter";
import { getCatalogPage } from "@@/lib/product-catalog-query";

interface HomeProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    min?: string;
    max?: string;
    rating?: string;
    sort?: string;
    priceCurrency?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const t = await getTranslations("catalog");
  const locale = await getLocale();
  const params = await searchParams;
  const query = params.q || "";
  const category = params.category || "";
  const minRating = params.rating ? parseInt(params.rating) : undefined;
  const sort = params.sort;
  const cookieStore = await cookies();
  const currency: SupportedCurrency = cookieStore.get("CURRENCY")?.value === "USD" ? "USD" : "TRY";
  const isPriceCurrencyCurrent = !params.priceCurrency || params.priceCurrency === currency;
  const effectiveMin = isPriceCurrencyCurrent ? params.min : undefined;
  const effectiveMax = isPriceCurrencyCurrent ? params.max : undefined;
  const minPrice = parsePriceFilterAmount(effectiveMin);
  const maxPrice = parsePriceFilterAmount(effectiveMax);
  const { products, hasMore } = await getCatalogPage({
    query,
    category,
    minPrice,
    maxPrice,
    minRating,
    sort,
    currency,
    locale,
  });

  // Fetch all categories for the sidebar (locale-aware)
  const allCategories = await prisma.category.findMany({
    select: { name: true, nameEn: true },
    orderBy: { name: "asc" },
  });

  const categories = allCategories.map((c) => locale === "en" && c.nameEn ? c.nameEn : c.name);

  // Fetch active banners and settings for carousel
  const banners = await prisma.banner.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      imageUrl: true,
      title: true,
      subtitle: true,
      order: true,
      displayMode: true,
      alignment: true,
    },
  });

  let bannerSettings = await prisma.bannerSettings.findFirst();

  // Create default settings if none exist
  if (!bannerSettings) {
    bannerSettings = await prisma.bannerSettings.create({
      data: {
        animationSpeed: 500,
        slideDelay: 3000,
        animationType: "slide",
        loop: true,
        arrowDisplay: "hover",
      },
    });
  }

  // Fetch carousels
  const bestSellerCarousel = await prisma.featuredCarousel.findUnique({
    where: { type: "best-seller" },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          product: {
            include: {
              category: true,
              translations: { where: { locale }, select: { title: true, description: true } },
              prices: { select: { currencyCode: true, price: true, salePrice: true } },
            },
          },
        },
      },
    },
  });

  const newProductsCarousel = await prisma.featuredCarousel.findUnique({
    where: { type: "new-products" },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          product: {
            include: {
              category: true,
              translations: { where: { locale }, select: { title: true, description: true } },
              prices: { select: { currencyCode: true, price: true, salePrice: true } },
            },
          },
        },
      },
    },
  });

  // Extract products from carousels, applying locale translation
  type FeaturedProduct = NonNullable<typeof bestSellerCarousel>["items"][number]["product"];
  const applyTranslation = (product: FeaturedProduct) => {
    const { translations: productTranslations, category, ...rest } = product;
    const tr = productTranslations[0];
    return {
      ...rest,
      title: tr?.title ?? product.title,
      description: tr?.description ?? product.description,
      category: category ? { ...category, name: locale === "en" && category.nameEn ? category.nameEn : category.name } : null,
    };
  };

  const bestSellers = bestSellerCarousel?.items.map(item => applyTranslation(item.product)) || [];
  const newProducts = newProductsCarousel?.items.map(item => applyTranslation(item.product)) || [];

  return (
    <>
      {!(query || category || minPrice || maxPrice || minRating) && banners.length > 0 && (
        <BannerCarousel banners={banners} settings={bannerSettings} />
      )}

      {/* Carousels only on home main view (no filters) */}
      {!(query || category || minPrice || maxPrice || minRating) && (
        <>
          {bestSellers.length > 0 && (
            <FeaturedProductsCarousel
              title={t("bestSellers")}
              products={bestSellers}
              variant="bestSellers"
              linkHref="/search?sort=popular"
            />
          )}

          {newProducts.length > 0 && (
            <FeaturedProductsCarousel
              title={t("newArrivals")}
              products={newProducts}
              variant="newArrivals"
              linkHref="/search?sort=newest"
            />
          )}
        </>
      )}

      <ProductCatalog
        initialProducts={products}
        initialHasMore={hasMore}
        categories={categories}
        locale={locale}
        variant="homeGrid"
        queryParams={{
          q: query,
          category,
          min: effectiveMin,
          max: effectiveMax,
          rating: params.rating,
          sort,
          priceCurrency: isPriceCurrencyCurrent ? params.priceCurrency : undefined,
        }}
        // Update title logic to show "All Products" below carousels
        title={query ? t("resultsFor", { query }) : t("allProducts")}
        description={query ? undefined : t("browseCollection")}
      />
    </>
  );
}
