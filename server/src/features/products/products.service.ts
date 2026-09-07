import type { Pool } from "pg";
import { TtlCache } from "../../shared/cache/ttlCache.js";
import { NotFoundError } from "../../shared/errors/index.js";
import { findProductByItemId } from "./products.repository.js";
import type { ProductDetailDTO } from "./products.types.js";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const productCache = new TtlCache<ProductDetailDTO>(CACHE_TTL_MS);

export async function getProductByItemId(
  pool: Pool,
  itemId: string,
  cache: TtlCache<ProductDetailDTO> = productCache
): Promise<ProductDetailDTO> {
  const cached = cache.get(itemId);
  if (cached) {
    return cached;
  }

  const product = await findProductByItemId(pool, itemId);
  if (!product) {
    throw new NotFoundError(`product not found: ${itemId}`);
  }

  cache.set(itemId, product);
  return product;
}
