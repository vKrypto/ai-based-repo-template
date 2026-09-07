import { describe, it, expect, afterAll } from "vitest";
import { Pool } from "pg";
import { findCategoryBySlug, findProductsForCategory, findAvailableFilters } from "./catalog.repository.js";
import type { CatalogFilters } from "./catalog.types.js";

const pool = new Pool({
  connectionString:
    process.env["DATABASE_URL"] ?? "postgres://barebrilliant:barebrilliant@localhost:5432/barebrilliant"
});

afterAll(async () => {
  await pool.end();
});

function baseFilters(overrides: Partial<CatalogFilters> = {}): CatalogFilters {
  return { sort: "best-sellers", page: 1, pageSize: 24, ...overrides };
}

describe("catalog.repository", () => {
  describe("findCategoryBySlug", () => {
    it("finds the seeded wedding-rings category", async () => {
      const category = await findCategoryBySlug(pool, "wedding-rings");
      expect(category?.slug).toBe("wedding-rings");
      expect(category?.name).toBe("Wedding Rings");
    });

    it("returns undefined for a slug that does not exist", async () => {
      const category = await findCategoryBySlug(pool, "does-not-exist");
      expect(category).toBeUndefined();
    });
  });

  describe("findProductsForCategory", () => {
    it("paginates the full unfiltered result set", async () => {
      const category = await findCategoryBySlug(pool, "wedding-rings");
      const result = await findProductsForCategory(pool, category!.id, baseFilters({ pageSize: 5 }));

      expect(result.items).toHaveLength(5);
      expect(result.total).toBeGreaterThanOrEqual(1000);
      const firstItem = result.items[0]!;
      expect(firstItem).toMatchObject({
        productId: expect.any(Number),
        itemId: expect.any(String),
        name: expect.any(String),
        price: expect.any(Number)
      });
    });

    it("narrows results by metal and reflects the smaller total", async () => {
      const category = await findCategoryBySlug(pool, "wedding-rings");
      const result = await findProductsForCategory(
        pool,
        category!.id,
        baseFilters({ metal: "Platinum", pageSize: 500 })
      );

      expect(result.total).toBeGreaterThan(0);
      expect(result.total).toBeLessThan(1000);
      expect(result.items.every((item) => item.metal === "Platinum")).toBe(true);
    });

    it("narrows results by a carat range", async () => {
      const category = await findCategoryBySlug(pool, "wedding-rings");
      const result = await findProductsForCategory(
        pool,
        category!.id,
        baseFilters({ caratMin: 1, caratMax: 1, pageSize: 500 })
      );

      expect(result.total).toBeGreaterThan(0);
      expect(result.items.every((item) => item.totalCarat === 1)).toBe(true);
    });

    it("narrows results by price range", async () => {
      const category = await findCategoryBySlug(pool, "wedding-rings");
      const result = await findProductsForCategory(
        pool,
        category!.id,
        baseFilters({ priceMin: 5000, pageSize: 500 })
      );

      expect(result.total).toBeGreaterThan(0);
      expect(result.items.every((item) => item.price >= 5000)).toBe(true);
    });

    it("narrows results with an in-category search term", async () => {
      const category = await findCategoryBySlug(pool, "wedding-rings");
      const result = await findProductsForCategory(
        pool,
        category!.id,
        baseFilters({ q: "eternity", pageSize: 500 })
      );

      expect(result.total).toBeGreaterThan(0);
      expect(result.items.every((item) => /eternity/i.test(item.name))).toBe(true);
    });

    it("includes a compareAtPrice higher than price for discounted items, and null for the rest", async () => {
      const category = await findCategoryBySlug(pool, "wedding-rings");
      const result = await findProductsForCategory(pool, category!.id, baseFilters({ pageSize: 500 }));

      const discounted = result.items.filter((item) => item.compareAtPrice !== null);
      expect(discounted.length).toBeGreaterThan(0);
      expect(discounted.every((item) => item.compareAtPrice! > item.price)).toBe(true);
      expect(result.items.some((item) => item.compareAtPrice === null)).toBe(true);
    });

    it("includes a hoverMedia image or video for most items, and null for the rest", async () => {
      const category = await findCategoryBySlug(pool, "wedding-rings");
      const result = await findProductsForCategory(pool, category!.id, baseFilters({ pageSize: 500 }));

      const withHoverMedia = result.items.filter((item) => item.hoverMedia !== null);
      expect(withHoverMedia.length).toBeGreaterThan(0);
      expect(withHoverMedia.every((item) => ["image", "video"].includes(item.hoverMedia!.mediaType))).toBe(true);
      expect(withHoverMedia.some((item) => item.hoverMedia!.mediaType === "video")).toBe(true);
      expect(result.items.some((item) => item.hoverMedia === null)).toBe(true);
    });

    it("returns an empty result set for a query that matches nothing", async () => {
      const category = await findCategoryBySlug(pool, "wedding-rings");
      const result = await findProductsForCategory(
        pool,
        category!.id,
        baseFilters({ q: "no-such-product-xyz" })
      );

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("sorts by price ascending", async () => {
      const category = await findCategoryBySlug(pool, "wedding-rings");
      const result = await findProductsForCategory(
        pool,
        category!.id,
        baseFilters({ sort: "price-asc", pageSize: 10 })
      );

      const prices = result.items.map((item) => item.price);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    it("sorts by price descending", async () => {
      const category = await findCategoryBySlug(pool, "wedding-rings");
      const result = await findProductsForCategory(
        pool,
        category!.id,
        baseFilters({ sort: "price-desc", pageSize: 10 })
      );

      const prices = result.items.map((item) => item.price);
      expect(prices).toEqual([...prices].sort((a, b) => b - a));
    });
  });

  describe("findAvailableFilters", () => {
    it("groups distinct attribute values per filter key with counts", async () => {
      const category = await findCategoryBySlug(pool, "wedding-rings");
      const filters = await findAvailableFilters(pool, category!.id);

      const metalFilter = filters.find((filter) => filter.key === "metal");
      expect(metalFilter?.label).toBe("Metal Type");
      expect(metalFilter?.values.some((value) => value.value === "Platinum" && value.count > 0)).toBe(true);

      const diamondTypeFilter = filters.find((filter) => filter.key === "diamondType");
      expect(diamondTypeFilter?.values.map((value) => value.value).sort()).toEqual(
        ["Lab-Grown Diamond", "Natural Diamond"].sort()
      );
    });
  });
});
