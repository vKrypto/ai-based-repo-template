import { describe, it, expect, afterAll } from "vitest";
import { Pool } from "pg";
import { getCatalogForCategory } from "./catalog.service.js";
import { NotFoundError } from "../../shared/errors/index.js";
import { TtlCache } from "../../shared/cache/ttlCache.js";
import type { CatalogFilters, CatalogResponseDTO } from "./catalog.types.js";

const CONNECTION_STRING =
  process.env["DATABASE_URL"] ?? "postgres://barebrilliant:barebrilliant@localhost:5432/barebrilliant";
const pool = new Pool({ connectionString: CONNECTION_STRING });

afterAll(async () => {
  await pool.end();
});

function baseFilters(overrides: Partial<CatalogFilters> = {}): CatalogFilters {
  return { sort: "best-sellers", page: 1, pageSize: 24, ...overrides };
}

describe("catalog.service", () => {
  it("returns the catalog page for a known category slug", async () => {
    const cache = new TtlCache<CatalogResponseDTO>(60_000);
    const result = await getCatalogForCategory(pool, "wedding-rings", baseFilters({ pageSize: 5 }), cache);

    expect(result.items).toHaveLength(5);
    expect(result.total).toBeGreaterThanOrEqual(1000);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(5);
    expect(result.availableFilters.length).toBeGreaterThan(0);
  });

  it("throws NotFoundError for an unknown category slug", async () => {
    const cache = new TtlCache<CatalogResponseDTO>(60_000);
    await expect(getCatalogForCategory(pool, "does-not-exist", baseFilters(), cache)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it("serves a repeated identical query from the cache instead of hitting Postgres again", async () => {
    const ephemeralPool = new Pool({ connectionString: CONNECTION_STRING });
    const cache = new TtlCache<CatalogResponseDTO>(60_000);
    const filters = baseFilters({ pageSize: 3 });

    const first = await getCatalogForCategory(ephemeralPool, "wedding-rings", filters, cache);
    await ephemeralPool.end();

    const second = await getCatalogForCategory(ephemeralPool, "wedding-rings", filters, cache);
    expect(second).toEqual(first);
  });
});
