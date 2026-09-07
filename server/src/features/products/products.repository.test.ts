import { describe, it, expect, afterAll } from "vitest";
import { Pool } from "pg";
import { findProductByItemId } from "./products.repository.js";

const pool = new Pool({
  connectionString:
    process.env["DATABASE_URL"] ?? "postgres://barebrilliant:barebrilliant@localhost:5432/barebrilliant"
});

afterAll(async () => {
  await pool.end();
});

describe("products.repository", () => {
  describe("findProductByItemId", () => {
    it("finds a seeded product by its item id with images and attributes", async () => {
      const product = await findProductByItemId(pool, "241257");

      expect(product).toMatchObject({
        itemId: "241257",
        name: expect.any(String),
        price: expect.any(Number),
        metal: expect.any(String),
        diamondType: expect.any(String),
        stoneShape: expect.any(String)
      });
      expect(product?.images.length).toBeGreaterThan(0);
    });

    it("returns undefined for an item id that does not exist", async () => {
      const product = await findProductByItemId(pool, "does-not-exist");
      expect(product).toBeUndefined();
    });

    it("returns an empty siblingVariants array for a single-variant product", async () => {
      const product = await findProductByItemId(pool, "241257");
      expect(product?.siblingVariants).toEqual([]);
    });

    it("includes compareAtPrice for a known discounted synthetic item", async () => {
      const product = await findProductByItemId(pool, "SYN-000003");
      expect(product?.price).toBe(2100);
      expect(product?.compareAtPrice).toBe(3000);
    });

    it("has a null compareAtPrice for a non-discounted item", async () => {
      const product = await findProductByItemId(pool, "SYN-000001");
      expect(product?.compareAtPrice).toBeNull();
    });

    it("excludes video hover-media rows from the PDP image gallery but exposes them as video", async () => {
      const product = await findProductByItemId(pool, "SYN-000004");
      expect(product?.images.every((url) => !url.endsWith(".mp4"))).toBe(true);
      expect(product?.video).toMatch(/\.mp4$/);
    });

    it("has a null video for a product with no video hover-media", async () => {
      const product = await findProductByItemId(pool, "241257");
      expect(product?.video).toBeNull();
    });
  });
});
