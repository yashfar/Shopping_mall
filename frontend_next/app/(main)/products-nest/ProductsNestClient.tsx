"use client";

import { useCallback, useEffect, useState } from "react";
import { useCurrency } from "@@/context/CurrencyContext";

const NEST_API_URL =
  process.env.NEXT_PUBLIC_NEST_API_URL || "http://localhost:4000";
const PAGE_SIZE = 12;

type NestCategory = { id: string; name: string; nameEn: string | null };
type NestColor = { color: string; colorHex: string | null };

type NestProduct = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  thumbnail: string | null;
  category: NestCategory | null;
  variants: {
    id: string;
    color: string;
    colorHex: string | null;
    stock: number;
  }[];
  avgRating: number;
  reviewCount: number;
};

type FiltersMeta = {
  categories: NestCategory[];
  colors: NestColor[];
  priceRange: { min: number; max: number };
};

type Filters = {
  categoryId: string;
  color: string;
  minPrice: string;
  maxPrice: string;
  rating: number | null;
};

const EMPTY_FILTERS: Filters = {
  categoryId: "",
  color: "",
  minPrice: "",
  maxPrice: "",
  rating: null,
};

function createFilterParams(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.color) params.set("color", filters.color);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.rating) params.set("rating", String(filters.rating));
  return params;
}

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill={i < Math.round(value) ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={i < Math.round(value) ? 0 : 1.5}
          className={`w-3.5 h-3.5 ${i < Math.round(value) ? "text-[#C8102E]" : "text-[#A9A9A9]"}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      ))}
    </div>
  );
}

export default function ProductsNestClient() {
  const { formatPrice } = useCurrency();

  const [filtersMeta, setFiltersMeta] = useState<FiltersMeta | null>(null);
  const [filtersMetaError, setFiltersMetaError] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [priceValidationError, setPriceValidationError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<NestProduct[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  // Load filter options (categories, colors, price range) once
  const loadFiltersMeta = useCallback(async () => {
    try {
      const res = await fetch(`${NEST_API_URL}/products/filters`);
      if (!res.ok) throw new Error("Failed to load filters");
      const data: FiltersMeta = await res.json();
      setFiltersMeta(data);
      console.log("Filters meta loaded:", data);
    } catch {
      setFiltersMetaError(true);
    }
  }, []);

  useEffect(() => {
    loadFiltersMeta();
  }, [loadFiltersMeta]);

  const fetchProducts = useCallback(async () => {
    const params = createFilterParams(filters);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));

    try {
      const res = await fetch(`${NEST_API_URL}/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load products");
      const data: { products: NestProduct[]; hasMore: boolean } =
        await res.json();
      setProducts(data.products);
      setHasMore(data.hasMore);
    } catch {
      setError(
        "Ürünler yüklenirken bir hata oluştu. NestJS backend (port 4000) çalışıyor mu?",
      );
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setLoading(true);
    setError("");
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyPriceFilter = () => {
    const minPrice = minPriceInput === "" ? null : Number(minPriceInput);
    const maxPrice = maxPriceInput === "" ? null : Number(maxPriceInput);

    if (
      (minPrice !== null && (!Number.isFinite(minPrice) || minPrice < 0)) ||
      (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0))
    ) {
      setPriceValidationError("Fiyatlar negatif olamaz.");
      return;
    }

    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      setPriceValidationError("Minimum fiyat, maksimum fiyattan büyük olamaz.");
      return;
    }

    setPriceValidationError("");
    setLoading(true);
    setError("");
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      minPrice: minPriceInput,
      maxPrice: maxPriceInput,
    }));
  };

  const clearAllFilters = () => {
    setLoading(true);
    setError("");
    setMinPriceInput("");
    setMaxPriceInput("");
    setPriceValidationError("");
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const exportProducts = async () => {
    setExporting(true);
    setExportError("");

    try {
      const params = createFilterParams(filters);
      const query = params.toString();
      const response = await fetch(
        `${NEST_API_URL}/products/export/xlsx${query ? `?${query}` : ""}`,
      );

      if (!response.ok) throw new Error("Failed to export products");

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `products-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch {
      setExportError("XLSX dosyası oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setExporting(false);
    }
  };

  const hasActiveFilters =
    filters.categoryId ||
    filters.color ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.rating;

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-12">
      <div className="pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tight">
              Ürünler
            </h1>
            <button
              type="button"
              onClick={exportProducts}
              disabled={exporting}
              className="inline-flex items-center justify-center rounded-lg bg-[#1A1A1A] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#C8102E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? "Hazırlanıyor..." : "XLSX Export"}
            </button>
          </div>
          {exportError && (
            <p className="mt-2 text-sm font-medium text-[#C8102E]" role="alert">
              {exportError}
            </p>
          )}
          <p className="text-base text-gray-500 mt-2 font-medium max-w-lg">
            Bu sayfa Next.js API routelarından bağımsız, ayrı bir NestJS
            servisinden (
            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
              {NEST_API_URL}
            </code>
            ) veri çeker.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-4">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="product-filters"
          className="fixed bottom-4 right-4 z-50 inline-flex w-auto items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-[#1A1A1A] shadow-lg transition-colors hover:border-[#C8102E] hover:text-[#C8102E] md:static md:rounded-lg md:shadow-none"
        >
          {filtersOpen ? "Filtreleri Gizle" : "Filtreleri Göster"}
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <path d="m5 7.5 5 5 5-5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div
        className={`max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 gap-8 ${filtersOpen ? "md:grid-cols-[260px_1fr]" : "md:grid-cols-1"}`}
      >
        {/* Filters sidebar */}
        {filtersOpen && (
          <>
            <button
              type="button"
              aria-label="Filtreleri kapat"
              onClick={() => setFiltersOpen(false)}
              className="fixed inset-0 z-30 bg-black/10 md:hidden"
            />
            <aside
              id="product-filters"
              className="custom-scrollbar fixed bottom-20 left-3 top-20 z-40 w-2/3 space-y-4 overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white p-3 shadow-2xl md:sticky md:top-25 md:z-10 md:h-fit md:max-h-[calc(100vh-20rem)] md:w-auto md:space-y-6 md:rounded-lg md:p-4 md:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-[#1A1A1A]">
                  Filtreler
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-[#C8102E] hover:text-[#A90D27] font-bold"
                  >
                    Temizle
                  </button>
                )}
              </div>

              {filtersMetaError && (
                <div className="border-t border-[#A9A9A9]/20 pt-4">
                  <div className="bg-red-50 border border-red-100 text-[#C8102E] rounded-lg p-3 text-xs font-semibold space-y-2">
                    <p>
                      Kategori/renk filtreleri yüklenemedi. NestJS backend (
                      <code className="bg-white/60 px-1 rounded">
                        {NEST_API_URL}
                      </code>
                      ) çalışıyor mu?
                    </p>
                    <button
                      onClick={() => {
                        setFiltersMetaError(false);
                        loadFiltersMeta();
                      }}
                      className="underline hover:text-[#A90D27]"
                    >
                      Tekrar dene
                    </button>
                  </div>
                </div>
              )}

              {/* Category */}
              {filtersMeta && filtersMeta.categories.length > 0 && (
                <div className="border-t border-[#A9A9A9]/20 pt-4">
                  <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">
                    Kategori
                  </h3>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    <label className="flex items-center cursor-pointer hover:bg-red-50 p-1.5 rounded-lg transition-colors group">
                      <input
                        type="radio"
                        name="product-category"
                        checked={filters.categoryId === ""}
                        onChange={() => updateFilter("categoryId", "")}
                        className="w-4 h-4 text-[#C8102E] border-[#A9A9A9] focus:ring-[#C8102E]"
                      />
                      <span className="ml-2.5 text-sm font-semibold text-[#1A1A1A] group-hover:text-[#C8102E] transition-colors">
                        Tümü
                      </span>
                    </label>
                    {filtersMeta.categories.map((cat) => (
                      <label
                        key={cat.id}
                        className="flex items-center cursor-pointer hover:bg-red-50 p-1.5 rounded-lg transition-colors group"
                      >
                        <input
                          type="radio"
                          name="product-category"
                          checked={filters.categoryId === cat.id}
                          onChange={() => updateFilter("categoryId", cat.id)}
                          className="w-4 h-4 text-[#C8102E] border-[#A9A9A9] focus:ring-[#C8102E]"
                        />
                        <span className="ml-2.5 text-sm font-semibold text-[#1A1A1A] group-hover:text-[#C8102E] transition-colors">
                          {cat.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Color */}
              {filtersMeta && filtersMeta.colors.length > 0 && (
                <div className="border-t border-[#A9A9A9]/20 pt-4">
                  <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">
                    Renk
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {filtersMeta.colors.map((c) => (
                      <button
                        key={c.color}
                        title={c.color}
                        onClick={() =>
                          updateFilter(
                            "color",
                            filters.color === c.color ? "" : c.color,
                          )
                        }
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          filters.color === c.color
                            ? "border-[#C8102E] scale-110"
                            : "border-gray-200"
                        }`}
                        style={{ backgroundColor: c.colorHex || "#ccc" }}
                      />
                    ))}
                  </div>
                  {filters.color && (
                    <p className="text-xs text-gray-500 mt-2 font-medium">
                      Seçili: {filters.color}
                    </p>
                  )}
                </div>
              )}

              {/* Price range */}
              <div className="border-t border-[#A9A9A9]/20 pt-4">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">
                  Fiyat Aralığı
                  {filtersMeta
                    ? ` (${(filtersMeta.priceRange.min / 100).toFixed(0)} - ${(filtersMeta.priceRange.max / 100).toFixed(0)} ₺)`
                    : ""}
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 md:flex-row">
                    <input
                      type="number"
                      value={minPriceInput}
                      onChange={(e) => {
                        setMinPriceInput(e.target.value);
                        setPriceValidationError("");
                      }}
                      placeholder="Min"
                      min="0"
                      aria-invalid={Boolean(priceValidationError)}
                      aria-describedby="price-validation-error"
                      className="w-full px-3 py-2 border border-[#A9A9A9] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                    />
                    <input
                      type="number"
                      value={maxPriceInput}
                      onChange={(e) => {
                        setMaxPriceInput(e.target.value);
                        setPriceValidationError("");
                      }}
                      placeholder="Max"
                      min="0"
                      aria-invalid={Boolean(priceValidationError)}
                      aria-describedby="price-validation-error"
                      className="w-full px-3 py-2 border border-[#A9A9A9] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                    />
                  </div>
                  {priceValidationError && (
                    <p
                      id="price-validation-error"
                      role="alert"
                      className="text-xs font-semibold text-[#C8102E]"
                    >
                      {priceValidationError}
                    </p>
                  )}
                  <button
                    onClick={applyPriceFilter}
                    className="w-full px-4 py-2 bg-[#C8102E] text-white rounded-lg hover:bg-[#A90D27] transition-all text-sm font-bold shadow-sm active:scale-95"
                  >
                    Fiyata Uygula
                  </button>
                </div>
              </div>

              {/* Rating */}
              <div className="border-t border-[#A9A9A9]/20 pt-4">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">
                  Müşteri Puanı
                </h3>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() =>
                        updateFilter("rating", filters.rating === r ? null : r)
                      }
                      className={`w-full flex items-center gap-2 p-2.5 rounded-xl transition-all ${
                        filters.rating === r
                          ? "bg-red-50 border-2 border-[#C8102E]"
                          : "border border-[#A9A9A9]/20 hover:border-[#C8102E]"
                      }`}
                    >
                      <StarRow value={r} />
                      <span
                        className={`text-sm font-bold ${filters.rating === r ? "text-[#C8102E]" : "text-[#A9A9A9]"}`}
                      >
                        ve üzeri
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Product grid */}
        <main>
          {error && (
            <div className="bg-red-50 border border-red-100 text-[#C8102E] rounded-lg p-4 mb-6 font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-gray-400 font-medium">
              Yükleniyor...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 font-medium">
                Bu filtrelere uygun ürün bulunamadı.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-square bg-gray-100">
                      {product.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                          Görsel yok
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      {product.category && (
                        <p className="text-xs font-bold text-[#A9A9A9] uppercase tracking-wide mb-1">
                          {product.category.name}
                        </p>
                      )}
                      <h3 className="font-bold text-[#1A1A1A] line-clamp-2 min-h-10">
                        {product.title}
                      </h3>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <StarRow value={product.avgRating} />
                        <span className="text-xs text-gray-400 font-medium">
                          ({product.reviewCount})
                        </span>
                      </div>

                      {product.variants.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          {product.variants.slice(0, 6).map((v) => (
                            <span
                              key={v.id}
                              title={v.color}
                              className="w-3.5 h-3.5 rounded-full border border-gray-300"
                              style={{ backgroundColor: v.colorHex || "#ccc" }}
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div>
                          {product.salePrice ? (
                            <div className="flex items-center gap-2">
                              <span className="font-black text-[#C8102E]">
                                {formatPrice(product.salePrice)}
                              </span>
                              <span className="text-xs text-gray-400 line-through">
                                {formatPrice(product.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-black text-[#1A1A1A]">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            product.stock > 0
                              ? "text-emerald-600"
                              : "text-[#C8102E]"
                          }`}
                        >
                          {product.stock > 0
                            ? `Stokta (${product.stock})`
                            : "Tükendi"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-4 mt-10">
                <button
                  onClick={() => {
                    setLoading(true);
                    setError("");
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={page === 1}
                  className="px-5 py-2.5 rounded-full border border-gray-200 font-bold text-sm text-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C8102E] hover:text-[#C8102E] transition-colors"
                >
                  Önceki
                </button>
                <span className="text-sm font-bold text-[#A9A9A9]">
                  Sayfa {page}
                </span>
                <button
                  onClick={() => {
                    setLoading(true);
                    setError("");
                    setPage((p) => p + 1);
                  }}
                  disabled={!hasMore}
                  className="px-5 py-2.5 rounded-full border border-gray-200 font-bold text-sm text-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C8102E] hover:text-[#C8102E] transition-colors"
                >
                  Sonraki
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
