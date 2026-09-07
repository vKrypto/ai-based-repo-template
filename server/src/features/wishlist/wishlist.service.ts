import type { Pool } from "pg";
import { ensureSessionId, findSessionId } from "../../shared/session/ensureSession.js";
import { NotFoundError } from "../../shared/errors/index.js";
import { findVariantIdByItemId } from "../../shared/catalog/variantLookup.js";
import { addWishlistItem, findWishlist, removeWishlistItem } from "./wishlist.repository.js";
import type { WishlistDTO } from "./wishlist.types.js";

async function resolveVariantId(pool: Pool, itemId: string): Promise<number> {
  const variantId = await findVariantIdByItemId(pool, itemId);
  if (variantId === undefined) {
    throw new NotFoundError(`product not found: ${itemId}`);
  }
  return variantId;
}

export async function getWishlist(pool: Pool, token: string): Promise<WishlistDTO> {
  const sessionId = await findSessionId(pool, token);
  return findWishlist(pool, sessionId);
}

export async function addToWishlist(pool: Pool, token: string, itemId: string): Promise<WishlistDTO> {
  const variantId = await resolveVariantId(pool, itemId);
  const sessionId = await ensureSessionId(pool, token);
  await addWishlistItem(pool, sessionId, variantId);
  return findWishlist(pool, sessionId);
}

export async function removeFromWishlist(pool: Pool, token: string, itemId: string): Promise<WishlistDTO> {
  const variantId = await resolveVariantId(pool, itemId);
  const sessionId = await ensureSessionId(pool, token);
  await removeWishlistItem(pool, sessionId, variantId);
  return findWishlist(pool, sessionId);
}
