import { describe, it, expect, afterAll } from "vitest";
import { Pool } from "pg";
import { upsertWeddingRingsCatalog } from "./upsertCatalog.js";
import type { IngestedProduct } from "./types.js";

const pool = new Pool({
  connectionString:
    process.env["DATABASE_URL"] ?? "postgres://barebrilliant:barebrilliant@localhost:5432/barebrilliant"
});

const TEST_CATEGORY_SLUG = "test-wedding-rings-upsert";

function buildProduct(overrides: Partial<IngestedProduct> = {}): IngestedProduct {
  return {
    itemId: "TEST-ITEM-1",
    name: "Test Eternity Ring",
    price: 1000,
    compareAtPrice: null,
    groupKey: null,
    metalType: "14K White Gold",
    diamondType: "Lab-Grown Diamond",
    totalCarat: 1,
    stoneShape: "Round",
    sourceUrl: "https://www.bluenile.com/wedding-rings/test-item-1",
    images: ["https://ion.bluenile.com/test-1.jpg"],
    isSynthetic: false,
    ...overrides
  };
}

afterAll(async () => {
  await pool.query("DELETE FROM category WHERE slug = $1", [TEST_CATEGORY_SLUG]);
  await pool.end();
});

describe("upsertWeddingRingsCatalog", () => {
  it("creates category, product, variant, image and attribute rows for a new product", async () => {
    await upsertWeddingRingsCatalog(pool, [buildProduct()], TEST_CATEGORY_SLUG);

    const variant = await pool.query(
      `SELECT pv.item_id, pv.price, pv.compare_at_price, p.name, p.is_synthetic
       FROM product_variant pv
       JOIN product p ON p.id = pv.product_id
       JOIN category c ON c.id = p.category_id
       WHERE c.slug = $1 AND pv.item_id = $2`,
      [TEST_CATEGORY_SLUG, "TEST-ITEM-1"]
    );
    expect(variant.rows).toHaveLength(1);
    expect(Number(variant.rows[0].price)).toBe(1000);
    expect(variant.rows[0].compare_at_price).toBeNull();
    expect(variant.rows[0].name).toBe("Test Eternity Ring");

    const variantSlug = await pool.query("SELECT slug FROM product_variant WHERE item_id = $1", ["TEST-ITEM-1"]);
    expect(variantSlug.rows[0].slug).toBe("test-eternity-ring");

    const images = await pool.query(
      `SELECT url FROM product_image pi
       JOIN product_variant pv ON pv.id = pi.variant_id
       WHERE pv.item_id = $1`,
      ["TEST-ITEM-1"]
    );
    expect(images.rows).toHaveLength(1);

    const attributeLinks = await pool.query(
      `SELECT av.value FROM variant_attribute_value vav
       JOIN product_variant pv ON pv.id = vav.variant_id
       JOIN attribute_value av ON av.id = vav.attribute_value_id
       WHERE pv.item_id = $1
       ORDER BY av.value`,
      ["TEST-ITEM-1"]
    );
    expect(attributeLinks.rows.map((row) => row.value)).toEqual(
      ["1", "14K White Gold", "Lab-Grown Diamond", "Round"].sort()
    );
  });

  it("is idempotent: re-running with an updated price updates the existing row instead of duplicating it", async () => {
    await upsertWeddingRingsCatalog(
      pool,
      [buildProduct({ price: 1500, compareAtPrice: 2000 })],
      TEST_CATEGORY_SLUG
    );

    const variants = await pool.query("SELECT price, compare_at_price FROM product_variant WHERE item_id = $1", [
      "TEST-ITEM-1"
    ]);
    expect(variants.rows).toHaveLength(1);
    expect(Number(variants.rows[0].price)).toBe(1500);
    expect(Number(variants.rows[0].compare_at_price)).toBe(2000);

    const products = await pool.query(
      `SELECT count(*)::int AS count FROM product p
       JOIN category c ON c.id = p.category_id
       WHERE c.slug = $1`,
      [TEST_CATEGORY_SLUG]
    );
    expect(products.rows[0].count).toBe(1);
  });

  it("groups two products sharing a groupKey as sibling variants of one product", async () => {
    await upsertWeddingRingsCatalog(
      pool,
      [
        buildProduct({ itemId: "TEST-ITEM-WHITE", groupKey: "test-group-a", metalType: "14K White Gold" }),
        buildProduct({ itemId: "TEST-ITEM-ROSE", groupKey: "test-group-a", metalType: "14K Rose Gold" })
      ],
      TEST_CATEGORY_SLUG
    );

    const variants = await pool.query(
      `SELECT pv.item_id, pv.product_id, pv.slug
       FROM product_variant pv
       WHERE pv.item_id IN ('TEST-ITEM-WHITE', 'TEST-ITEM-ROSE')
       ORDER BY pv.item_id`
    );
    expect(variants.rows).toHaveLength(2);
    expect(variants.rows[0]!.product_id).toBe(variants.rows[1]!.product_id);
    expect(variants.rows[0]!.slug).toBe("test-eternity-ring-in-14k-rose-gold");
    expect(variants.rows[1]!.slug).toBe("test-eternity-ring-in-14k-white-gold");
  });
});
