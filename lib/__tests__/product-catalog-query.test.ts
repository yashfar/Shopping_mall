import assert from "node:assert/strict";
import test from "node:test";
import { buildCatalogRequestParams } from "@@/lib/catalog-query-params";
import {
    filterAndSortCatalogCandidates,
    type CatalogOrderCandidate,
    type CatalogReviewStats,
} from "@@/lib/product-catalog-query";

const createdAt = new Date("2026-01-01T00:00:00.000Z");

function candidate(
    id: string,
    legacyPrice: number,
    prices: CatalogOrderCandidate["prices"],
    legacySalePrice: number | null = null,
): CatalogOrderCandidate {
    return {
        id,
        price: legacyPrice,
        salePrice: legacySalePrice,
        createdAt,
        prices,
        _count: { prices: prices.length },
    };
}

test("price sorting uses the selected ProductPrice currency", () => {
    const candidates = [
        candidate("a", 9_999, [
            { currencyCode: "TRY", price: 100, salePrice: null },
            { currencyCode: "USD", price: 300, salePrice: null },
        ]),
        candidate("b", 1, [
            { currencyCode: "TRY", price: 200, salePrice: null },
            { currencyCode: "USD", price: 100, salePrice: null },
        ]),
    ];
    const reviewStats = new Map<string, CatalogReviewStats>();

    const tryOrder = filterAndSortCatalogCandidates({
        candidates,
        currency: "TRY",
        sort: "price_asc",
        reviewStats,
    }).map((product) => product.id);
    const usdOrder = filterAndSortCatalogCandidates({
        candidates,
        currency: "USD",
        sort: "price_asc",
        reviewStats,
    }).map((product) => product.id);

    assert.deepEqual(tryOrder, ["a", "b"]);
    assert.deepEqual(usdOrder, ["b", "a"]);
});

test("ascending and descending price sorts use the selected currency sale price", () => {
    const candidates = [
        candidate("discounted", 99_999, [
            { currencyCode: "TRY", price: 1_000, salePrice: 500 },
            { currencyCode: "USD", price: 1_000, salePrice: 500 },
        ]),
        candidate("regular", 1, [
            { currencyCode: "TRY", price: 600, salePrice: null },
            { currencyCode: "USD", price: 600, salePrice: null },
        ]),
    ];
    const reviewStats = new Map<string, CatalogReviewStats>();

    for (const currency of ["TRY", "USD"] as const) {
        const ascending = filterAndSortCatalogCandidates({
            candidates,
            currency,
            sort: "price_asc",
            reviewStats,
        }).map((product) => product.id);
        const descending = filterAndSortCatalogCandidates({
            candidates,
            currency,
            sort: "price_desc",
            reviewStats,
        }).map((product) => product.id);

        assert.deepEqual(ascending, ["discounted", "regular"]);
        assert.deepEqual(descending, ["regular", "discounted"]);
    }
});

test("legacy TRY fallback uses salePrice while USD keeps missing-currency products last", () => {
    const candidates = [
        candidate("legacy-discount", 1_000, [], 500),
        candidate("priced", 600, [
            { currencyCode: "TRY", price: 600, salePrice: null },
            { currencyCode: "USD", price: 600, salePrice: null },
        ]),
    ];
    const reviewStats = new Map<string, CatalogReviewStats>();

    const tryOrder = filterAndSortCatalogCandidates({
        candidates,
        currency: "TRY",
        sort: "price_asc",
        reviewStats,
    }).map((product) => product.id);
    const usdOrder = filterAndSortCatalogCandidates({
        candidates,
        currency: "USD",
        sort: "price_asc",
        reviewStats,
    }).map((product) => product.id);

    assert.deepEqual(tryOrder, ["legacy-discount", "priced"]);
    assert.deepEqual(usdOrder, ["priced", "legacy-discount"]);
});

test("rating filtering and rating sorting happen across the full candidate set", () => {
    const candidates = [
        candidate("low", 100, []),
        candidate("top", 300, []),
        candidate("mid", 200, []),
    ];
    const reviewStats = new Map<string, CatalogReviewStats>([
        ["low", { average: 2, count: 20 }],
        ["top", { average: 5, count: 2 }],
        ["mid", { average: 4, count: 10 }],
    ]);

    const result = filterAndSortCatalogCandidates({
        candidates,
        currency: "TRY",
        minRating: 4,
        sort: "rating_desc",
        reviewStats,
    });

    assert.deepEqual(result.map((product) => product.id), ["top", "mid"]);
});

test("review-count sorting is global", () => {
    const candidates = [
        candidate("few", 100, []),
        candidate("most", 200, []),
        candidate("middle", 300, []),
    ];
    const reviewStats = new Map<string, CatalogReviewStats>([
        ["few", { average: 5, count: 1 }],
        ["most", { average: 3, count: 20 }],
        ["middle", { average: 4, count: 10 }],
    ]);

    const result = filterAndSortCatalogCandidates({
        candidates,
        currency: "TRY",
        sort: "reviews_desc",
        reviewStats,
    });

    assert.deepEqual(result.map((product) => product.id), ["most", "middle", "few"]);
});

test("infinite-scroll parameters omit empty values and preserve valid false-like strings", () => {
    const params = buildCatalogRequestParams({
        page: 2,
        pageSize: 12,
        locale: "en",
        queryParams: {
            min: undefined,
            max: null,
            category: "",
            inStock: "false",
            rating: "0",
        },
    });

    assert.equal(params.has("min"), false);
    assert.equal(params.has("max"), false);
    assert.equal(params.has("category"), false);
    assert.equal(params.get("inStock"), "false");
    assert.equal(params.get("rating"), "0");
    assert.equal(params.toString().includes("=undefined"), false);
    assert.equal(params.toString().includes("=null"), false);
});
