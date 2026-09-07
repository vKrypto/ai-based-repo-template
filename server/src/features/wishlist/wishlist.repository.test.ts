import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { ensureSessionId } from "../../shared/session/ensureSession.js";
import { findVariantIdByItemId } from "../../shared/catalog/variantLookup.js";
import { findWishlist, addWishlistItem, removeWishlistItem } from "./wishlist.repository.js";

const pool = new Pool({
  connectionString:
    process.env["DATABASE_URL"] ?? "postgres://barebrilliant:barebrilliant@localhost:5432/barebrilliant"
});

let sessionId: number;
let variantId: number;

beforeAll(async () => {
  sessionId = await ensureSessionId(pool, `wishlist-repo-test-${randomUUID()}`);
  variantId = (await findVariantIdByItemId(pool, "241257"))!;
});

afterAll(async () => {
  await pool.end();
});

describe("wishlist.repository", () => {
  it("returns an empty wishlist for a session with no items", async () => {
    const emptySessionId = await ensureSessionId(pool, `wishlist-repo-empty-${randomUUID()}`);
    expect(await findWishlist(pool, emptySessionId)).toEqual({ items: [] });
  });

  it("adds an item to the wishlist", async () => {
    await addWishlistItem(pool, sessionId, variantId);
    const wishlist = await findWishlist(pool, sessionId);

    expect(wishlist.items).toHaveLength(1);
    expect(wishlist.items[0]).toMatchObject({ itemId: "241257", categorySlug: "wedding-rings" });
  });

  it("is idempotent: adding the same item twice does not duplicate it", async () => {
    await addWishlistItem(pool, sessionId, variantId);
    const wishlist = await findWishlist(pool, sessionId);

    expect(wishlist.items).toHaveLength(1);
  });

  it("removes an item from the wishlist", async () => {
    await removeWishlistItem(pool, sessionId, variantId);
    expect(await findWishlist(pool, sessionId)).toEqual({ items: [] });
  });
});
