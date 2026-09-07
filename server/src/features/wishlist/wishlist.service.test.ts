import { describe, it, expect, afterAll } from "vitest";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { NotFoundError } from "../../shared/errors/index.js";
import { getWishlist, addToWishlist, removeFromWishlist } from "./wishlist.service.js";

const pool = new Pool({
  connectionString:
    process.env["DATABASE_URL"] ?? "postgres://barebrilliant:barebrilliant@localhost:5432/barebrilliant"
});

afterAll(async () => {
  await pool.end();
});

describe("wishlist.service", () => {
  it("returns an empty wishlist for a brand new token without creating a session row", async () => {
    expect(await getWishlist(pool, `wishlist-service-new-${randomUUID()}`)).toEqual({ items: [] });
  });

  it("adds an item and returns the updated wishlist", async () => {
    const token = `wishlist-service-${randomUUID()}`;
    const wishlist = await addToWishlist(pool, token, "241257");

    expect(wishlist.items).toHaveLength(1);
    expect(wishlist.items[0]).toMatchObject({ itemId: "241257" });
  });

  it("throws NotFoundError when adding an unknown item id", async () => {
    await expect(addToWishlist(pool, `wishlist-service-${randomUUID()}`, "does-not-exist")).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it("removes an item from the wishlist", async () => {
    const token = `wishlist-service-${randomUUID()}`;
    await addToWishlist(pool, token, "241257");
    const wishlist = await removeFromWishlist(pool, token, "241257");

    expect(wishlist.items).toEqual([]);
  });
});
