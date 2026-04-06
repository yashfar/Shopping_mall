import { prisma } from "@/lib/prisma";
import ProductCatalog from "@@/components/ProductCatalog";
import { getSortOrder, sortProducts } from "@@/lib/sort-utils";
import BannerCarousel from "@@/components/BannerCarousel";
import FeaturedProductsCarousel from "@@/components/FeaturedProductsCarousel";
import { getTranslations, getLocale } from "next-intl/server";

interface HomeProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    min?: string;
    max?: string;
    rating?: string;
    sort?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const t = await getTranslations("catalog");
  const locale = await getLocale();
  const params = await searchParams;
  const query = params.q || "";
  const category = params.category || "";
  const minPrice = params.min ? parseFloat(params.min) * 100 : undefined; // Convert to cents
  const maxPrice = params.max ? parseFloat(params.max) * 100 : undefined; // Convert to cents
  const minRating = params.rating ? parseInt(params.rating) : undefined;
  const sort = params.sort;

  // Build Prisma where clause
  const whereClause: any = {
    isActive: true,
  };

  // Search query (optional for home, but good to have)
  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  // Category filter (match TR or EN name)
  if (category) {
    whereClause.category = {
      OR: [
        { name: { equals: category, mode: "insensitive" } },
        { nameEn: { equals: category, mode: "insensitive" } },
      ],
    };
  }

  // Price filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    whereClause.price = {};
    if (minPrice !== undefined) whereClause.price.gte = minPrice;
    if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
  }

  // Fetch initial page of products (12 items)
  const rawProducts = await prisma.product.findMany({
    where: whereClause,
    include: {
      reviews: { select: { id: true, rating: true } },
      variants: { select: { id: true, color: true, colorHex: true, stock: true } },
      category: { select: { id: true, name: true, nameEn: true } },
      translations: { where: { locale }, select: { title: true, description: true } },
    },
    orderBy: getSortOrder(sort),
    take: 12,
  });

  const products = rawProducts.map(({ translations, category, ...p }) => {
    const tr = translations[0];
    return {
      ...p,
      title: tr?.title ?? p.title,
      description: tr?.description ?? p.description,
      category: category ? { ...category, name: locale === "en" && category.nameEn ? category.nameEn : category.name } : null,
    };
  });

  // Filter by rating (client-side)
  let filteredProducts = minRating
    ? products.filter((product) => {
      if (product.reviews.length === 0) return false;
      const avgRating =
        product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length;
      return avgRating >= minRating;
    })
    : products;

  // Apply sorting
  filteredProducts = sortProducts(filteredProducts, sort);

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
            },
          },
        },
      },
    },
  });

  // Extract products from carousels, applying locale translation
  const applyTranslation = (product: any) => {
    const tr = product.translations?.[0];
    const { translations, category, ...rest } = product;
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
              linkHref="/search?sort=popular"
            />
          )}

          {newProducts.length > 0 && (
            <FeaturedProductsCarousel
              title={t("newArrivals")}
              products={newProducts}
              linkHref="/search?sort=newest"
            />
          )}
        </>
      )}

      <ProductCatalog
        initialProducts={filteredProducts}
        categories={categories}
        locale={locale}
        queryParams={{
          q: query,
          category,
          min: params.min,
          max: params.max,
          rating: params.rating,
          sort,
        }}
        // Update title logic to show "All Products" below carousels
        title={query ? t("resultsFor", { query }) : t("allProducts")}
        description={query ? undefined : t("browseCollection")}
      />
    </>
  );
}
