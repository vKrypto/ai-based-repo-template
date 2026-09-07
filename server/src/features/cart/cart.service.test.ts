import { describe, it, expect, afterAll } from "vitest";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { getCart, addCartItem, updateCartItemQuantity, removeFromCart } from "./cart.service.js";

const pool = new Pool({
  connectionString:
    process.env["DATABASE_URL"] ?? "postgres://barebrilliant:barebrilliant@localhost:5432/barebrilliant"
});

afterAll(async () => {
  await pool.end();
});

describe("cart.service", () => {
  it("returns an empty cart for a brand new token without creating a session row", async () => {
    const cart = await getCart(pool, `cart-service-new-${randomUUID()}`);
    expect(cart).toEqual({ items: [], itemCount: 0, subtotal: 0 });
  });

  it("adds an item to the cart and returns the updated cart", async () => {
    const token = `cart-service-${randomUUID()}`;
    const cart = await addCartItem(pool, token, "241257", 1);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({ itemId: "241257", quantity: 1 });
  });

  it("throws NotFoundError when adding an unknown item id", async () => {
    await expect(addCartItem(pool, `cart-service-${randomUUID()}`, "does-not-exist", 1)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it("rejects a non-positive quantity when adding", async () => {
    await expect(addCartItem(pool, `cart-service-${randomUUID()}`, "241257", 0)).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  it("updates the quantity of an existing item", async () => {
    const token = `cart-service-${randomUUID()}`;
    await addCartItem(pool, token, "241257", 1);
    const cart = await updateCartItemQuantity(pool, token, "241257", 4);

    expect(cart.items[0]?.quantity).toBe(4);
  });

  it("rejects an out-of-range quantity when updating", async () => {
    const token = `cart-service-${randomUUID()}`;
    await addCartItem(pool, token, "241257", 1);
    await expect(updateCartItemQuantity(pool, token, "241257", 99)).rejects.toBeInstanceOf(ValidationError);
  });

  it("removes an item from the cart", async () => {
    const token = `cart-service-${randomUUID()}`;
    await addCartItem(pool, token, "241257", 1);
    const cart = await removeFromCart(pool, token, "241257");

    expect(cart.items).toEqual([]);
  });
});
