import { describe, it, expect } from "vitest";
import {
  parseCatalogFilters,
  catalogFiltersToSearchParams,
  titleCaseSlug,
  formatPrice,
  buildProductPath,
  calculateDiscountPercent
} from "./catalogQuery.js";

describe("parseCatalogFilters", () => {
  it("defaults to best-sellers sort and page 1 when the URL has no params", () => {
    expect(parseCatalogFilters(new URLSearchParams())).toEqual({ sort: "best-sellers", page: 1 });
  });

  it("reads string filters, numeric ranges, sort and page from the URL", () => {
    const searchParams = new URLSearchParams(
      "metal=Platinum&diamondType=Lab-Grown+Diamond&stoneShape=Round&caratMin=1&caratMax=2&priceMin=1000&priceMax=5000&q=eternity&sort=price-asc&page=3"
    );

    expect(parseCatalogFilters(searchParams)).toEqual({
      metal: "Platinum",
      diamondType: "Lab-Grown Diamond",
      stoneShape: "Round",
      caratMin: 1,
      caratMax: 2,
      priceMin: 1000,
      priceMax: 5000,
      q: "eternity",
      sort: "price-asc",
      page: 3
    });
  });

  it("falls back to best-sellers for an unrecognized sort value", () => {
    expect(parseCatalogFilters(new URLSearchParams("sort=bogus")).sort).toBe("best-sellers");
  });

  it("ignores a non-numeric page and falls back to 1", () => {
    expect(parseCatalogFilters(new URLSearchParams("page=abc")).page).toBe(1);
  });
});

describe("catalogFiltersToSearchParams", () => {
  it("omits default sort and page from the URL", () => {
    const params = catalogFiltersToSearchParams({ sort: "best-sellers", page: 1 });
    expect(params.toString()).toBe("");
  });

  it("includes only the filters that are set", () => {
    const params = catalogFiltersToSearchParams({ metal: "Platinum", sort: "price-desc", page: 2 });
    expect(params.get("metal")).toBe("Platinum");
    expect(params.get("sort")).toBe("price-desc");
    expect(params.get("page")).toBe("2");
    expect(params.has("diamondType")).toBe(false);
  });
});

describe("titleCaseSlug", () => {
  it("titleCaseSlug('wedding-rings') -> 'Wedding Rings'", () => {
    expect(titleCaseSlug("wedding-rings")).toBe("Wedding Rings");
  });

  it("titleCaseSlug('engagement-rings') -> 'Engagement Rings'", () => {
    expect(titleCaseSlug("engagement-rings")).toBe("Engagement Rings");
  });
});

describe("formatPrice", () => {
  it("formatPrice(2620) -> '$2,620'", () => {
    expect(formatPrice(2620)).toBe("$2,620");
  });

  it("formatPrice(999) -> '$999'", () => {
    expect(formatPrice(999)).toBe("$999");
  });
});

describe("buildProductPath", () => {
  it("builds the trailing -item-{id} product detail path", () => {
    expect(buildProductPath("wedding-rings", "low-dome-basket-ring", "241257")).toBe(
      "/wedding-rings/low-dome-basket-ring-item-241257"
    );
  });
});

describe("calculateDiscountPercent", () => {
  it("calculateDiscountPercent(825, 1100) -> 25", () => {
    expect(calculateDiscountPercent(825, 1100)).toBe(25);
  });

  it("rounds to the nearest whole percent", () => {
    expect(calculateDiscountPercent(2620, 3200)).toBe(18);
  });
});
