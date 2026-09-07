import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { ensureSessionId } from "../../shared/session/ensureSession.js";
import { findVariantIdByItemId } from "../../shared/catalog/variantLookup.js";
import { findCart, upsertCartItem, setCartItemQuantity, removeCartItem } from "./cart.repository.js";

const pool = new Pool({
  connectionString:
    process.env["DATABASE_URL"] ?? "postgres://barebrilliant:barebrilliant@localhost:5432/barebrilliant"
});

let sessionId: number;
let variantId: number;

beforeAll(async () => {
  sessionId = await ensureSessionId(pool, `cart-repo-test-${randomUUID()}`);
  const variant = await findVariantIdByItemId(pool, "241257");
  variantId = variant!;
});

afterAll(async () => {
  await pool.end();
});

describe("cart.repository", () => {
  describe("findVariantIdByItemId", () => {
    it("resolves the internal variant id for a known item id", async () => {
      expect(await findVariantIdByItemId(pool, "241257")).toEqual(expect.any(Number));
    });

    it("returns undefined for an unknown item id", async () => {
      expect(await findVariantIdByItemId(pool, "does-not-exist")).toBeUndefined();
    });
  });

  describe("findCart", () => {
    it("returns an empty cart for a session with no items", async () => {
      const emptySessionId = await ensureSessionId(pool, `cart-repo-empty-${randomUUID()}`);
      const cart = await findCart(pool, emptySessionId);
      expect(cart).toEqual({ items: [], itemCount: 0, subtotal: 0 });
    });
  });

  describe("upsertCartItem / setCartItemQuantity / removeCartItem", () => {
    it("adds a new item to the cart", async () => {
      await upsertCartItem(pool, sessionId, variantId, 1);
      const cart = await findCart(pool, sessionId);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]).toMatchObject({ itemId: "241257", quantity: 1, categorySlug: "wedding-rings" });
      expect(cart.itemCount).toBe(1);
    });

    it("increments quantity when the same variant is added again", async () => {
      await upsertCartItem(pool, sessionId, variantId, 2);
      const cart = await findCart(pool, sessionId);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]?.quantity).toBe(3);
    });

    it("sets an exact quantity", async () => {
      await setCartItemQuantity(pool, sessionId, variantId, 5);
      const cart = await findCart(pool, sessionId);

      expect(cart.items[0]?.quantity).toBe(5);
      expect(cart.subtotal).toBe(cart.items[0]!.price * 5);
    });

    it("removes the item from the cart", async () => {
      await removeCartItem(pool, sessionId, variantId);
      const cart = await findCart(pool, sessionId);

      expect(cart.items).toEqual([]);
    });
  });
});
