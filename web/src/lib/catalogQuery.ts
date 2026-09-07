import type { CatalogFilterState, CatalogSort } from "./catalogTypes.js";

const SORT_OPTIONS: readonly CatalogSort[] = ["best-sellers", "price-asc", "price-desc"];
const DEFAULT_SORT: CatalogSort = "best-sellers";
const DEFAULT_PAGE = 1;

function readString(searchParams: URLSearchParams, key: string): string | undefined {
  const value = searchParams.get(key);
  return value && value.trim() !== "" ? value : undefined;
}

function readNumber(searchParams: URLSearchParams, key: string): number | undefined {
  const raw = readString(searchParams, key);
  if (raw === undefined) {
    return undefined;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readSort(searchParams: URLSearchParams): CatalogSort {
  const raw = searchParams.get("sort");
  return SORT_OPTIONS.includes(raw as CatalogSort) ? (raw as CatalogSort) : DEFAULT_SORT;
}

export function parseCatalogFilters(searchParams: URLSearchParams): CatalogFilterState {
  return {
    metal: readString(searchParams, "metal"),
    diamondType: readString(searchParams, "diamondType"),
    stoneShape: readString(searchParams, "stoneShape"),
    caratMin: readNumber(searchParams, "caratMin"),
    caratMax: readNumber(searchParams, "caratMax"),
    priceMin: readNumber(searchParams, "priceMin"),
    priceMax: readNumber(searchParams, "priceMax"),
    q: readString(searchParams, "q"),
    sort: readSort(searchParams),
    page: readNumber(searchParams, "page") ?? DEFAULT_PAGE
  };
}

export function catalogFiltersToSearchParams(filters: CatalogFilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.metal) params.set("metal", filters.metal);
  if (filters.diamondType) params.set("diamondType", filters.diamondType);
  if (filters.stoneShape) params.set("stoneShape", filters.stoneShape);
  if (filters.caratMin !== undefined) params.set("caratMin", String(filters.caratMin));
  if (filters.caratMax !== undefined) params.set("caratMax", String(filters.caratMax));
  if (filters.priceMin !== undefined) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax !== undefined) params.set("priceMax", String(filters.priceMax));
  if (filters.q) params.set("q", filters.q);
  if (filters.sort !== DEFAULT_SORT) params.set("sort", filters.sort);
  if (filters.page !== DEFAULT_PAGE) params.set("page", String(filters.page));

  return params;
}

// titleCaseSlug("wedding-rings") -> "Wedding Rings"
export function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// formatPrice(2620) -> "$2,620"
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

// calculateDiscountPercent(825, 1100) -> 25
export function calculateDiscountPercent(price: number, compareAtPrice: number): number {
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

// buildProductPath("wedding-rings", "low-dome-basket-ring", "241257") -> "/wedding-rings/low-dome-basket-ring-item-241257"
export function buildProductPath(categorySlug: string, productSlug: string, itemId: string): string {
  return `/${categorySlug}/${productSlug}-item-${itemId}`;
}
