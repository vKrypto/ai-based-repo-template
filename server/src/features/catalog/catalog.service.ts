import type { Pool } from "pg";
import { TtlCache } from "../../shared/cache/ttlCache.js";
import { NotFoundError } from "../../shared/errors/index.js";
import { findAvailableFilters, findCategoryBySlug, findProductsForCategory } from "./catalog.repository.js";
import type { CatalogFilters, CatalogResponseDTO } from "./catalog.types.js";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const catalogCache = new TtlCache<CatalogResponseDTO>(CACHE_TTL_MS);

function buildCacheKey(categorySlug: string, filters: CatalogFilters): string {
  return JSON.stringify({ categorySlug, ...filters });
}

export async function getCatalogForCategory(
  pool: Pool,
  categorySlug: string,
  filters: CatalogFilters,
  cache: TtlCache<CatalogResponseDTO> = catalogCache
): Promise<CatalogResponseDTO> {
  const cacheKey = buildCacheKey(categorySlug, filters);
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const category = await findCategoryBySlug(pool, categorySlug);
  if (!category) {
    throw new NotFoundError(`category not found: ${categorySlug}`);
  }

  const [{ items, total }, availableFilters] = await Promise.all([
    findProductsForCategory(pool, category.id, filters),
    findAvailableFilters(pool, category.id)
  ]);

  const response: CatalogResponseDTO = {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    availableFilters
  };
  cache.set(cacheKey, response);
  return response;
}
