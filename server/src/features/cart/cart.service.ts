import type { Pool } from "pg";
import { ensureSessionId, findSessionId } from "../../shared/session/ensureSession.js";
import { findVariantIdByItemId } from "../../shared/catalog/variantLookup.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { findCart, removeCartItem, setCartItemQuantity, upsertCartItem } from "./cart.repository.js";
import type { CartDTO } from "./cart.types.js";

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 10;

function assertValidQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < MIN_QUANTITY || quantity > MAX_QUANTITY) {
    throw new ValidationError(`quantity must be an integer between ${MIN_QUANTITY} and ${MAX_QUANTITY}`);
  }
}

async function resolveVariantId(pool: Pool, itemId: string): Promise<number> {
  const variantId = await findVariantIdByItemId(pool, itemId);
  if (variantId === undefined) {
    throw new NotFoundError(`product not found: ${itemId}`);
  }
  return variantId;
}

export async function getCart(pool: Pool, token: string): Promise<CartDTO> {
  const sessionId = await findSessionId(pool, token);
  return findCart(pool, sessionId);
}

export async function addCartItem(pool: Pool, token: string, itemId: string, quantity: number): Promise<CartDTO> {
  assertValidQuantity(quantity);
  const variantId = await resolveVariantId(pool, itemId);
  const sessionId = await ensureSessionId(pool, token);
  await upsertCartItem(pool, sessionId, variantId, quantity);
  return findCart(pool, sessionId);
}

export async function updateCartItemQuantity(
  pool: Pool,
  token: string,
  itemId: string,
  quantity: number
): Promise<CartDTO> {
  assertValidQuantity(quantity);
  const variantId = await resolveVariantId(pool, itemId);
  const sessionId = await ensureSessionId(pool, token);
  await setCartItemQuantity(pool, sessionId, variantId, quantity);
  return findCart(pool, sessionId);
}

export async function removeFromCart(pool: Pool, token: string, itemId: string): Promise<CartDTO> {
  const variantId = await resolveVariantId(pool, itemId);
  const sessionId = await ensureSessionId(pool, token);
  await removeCartItem(pool, sessionId, variantId);
  return findCart(pool, sessionId);
}
