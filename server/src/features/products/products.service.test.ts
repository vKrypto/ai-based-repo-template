import { describe, it, expect, afterAll } from "vitest";
import { Pool } from "pg";
import { getProductByItemId } from "./products.service.js";
import { NotFoundError } from "../../shared/errors/index.js";
import { TtlCache } from "../../shared/cache/ttlCache.js";
import type { ProductDetailDTO } from "./products.types.js";

const CONNECTION_STRING =
  process.env["DATABASE_URL"] ?? "postgres://barebrilliant:barebrilliant@localhost:5432/barebrilliant";
const pool = new Pool({ connectionString: CONNECTION_STRING });

afterAll(async () => {
  await pool.end();
});

describe("products.service", () => {
  it("returns product detail for a known item id", async () => {
    const cache = new TtlCache<ProductDetailDTO>(60_000);
    const product = await getProductByItemId(pool, "241257", cache);
    expect(product.itemId).toBe("241257");
  });

  it("throws NotFoundError for an unknown item id", async () => {
    const cache = new TtlCache<ProductDetailDTO>(60_000);
    await expect(getProductByItemId(pool, "does-not-exist", cache)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("serves a repeated lookup from the cache instead of hitting Postgres again", async () => {
    const ephemeralPool = new Pool({ connectionString: CONNECTION_STRING });
    const cache = new TtlCache<ProductDetailDTO>(60_000);

    const first = await getProductByItemId(ephemeralPool, "241257", cache);
    await ephemeralPool.end();

    const second = await getProductByItemId(ephemeralPool, "241257", cache);
    expect(second).toEqual(first);
  });
});
