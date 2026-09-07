import { describe, it, expect, afterAll } from "vitest";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { ensureSessionId } from "../../shared/session/ensureSession.js";
import { findVariantIdByItemId } from "../../shared/catalog/variantLookup.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { placeOrder, getOrder } from "./orders.service.js";
import type { ShippingAddressInput } from "./orders.types.js";

const pool = new Pool({
  connectionString:
    process.env["DATABASE_URL"] ?? "postgres://barebrilliant:barebrilliant@localhost:5432/barebrilliant"
});

const ADDRESS: ShippingAddressInput = {
  name: "Ada Lovelace",
  line1: "123 Analytical Engine Ave",
  city: "London",
  state: "England",
  postalCode: "SW1A 1AA",
  country: "United Kingdom"
};

afterAll(async () => {
  await pool.end();
});

async function seedCart(token: string, quantity = 1): Promise<void> {
  const sessionId = await ensureSessionId(pool, token);
  const variantId = (await findVariantIdByItemId(pool, "241257"))!;
  await pool.query(
    "INSERT INTO cart_item (session_id, variant_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (session_id, variant_id) DO UPDATE SET quantity = $3",
    [sessionId, variantId, quantity]
  );
}

describe("orders.service", () => {
  it("places an order from the current cart, clears the cart, and returns the order", async () => {
    const token = `orders-service-${randomUUID()}`;
    await seedCart(token, 2);

    const order = await placeOrder(pool, token, ADDRESS);

    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({ itemId: "241257", quantity: 2 });
    expect(order.shippingAddress.name).toBe("Ada Lovelace");

    const fetched = await getOrder(pool, order.orderId);
    expect(fetched.orderId).toBe(order.orderId);
  });

  it("throws ValidationError when the cart is empty", async () => {
    const token = `orders-service-empty-${randomUUID()}`;
    await expect(placeOrder(pool, token, ADDRESS)).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when a required address field is missing", async () => {
    const token = `orders-service-${randomUUID()}`;
    await seedCart(token);

    await expect(placeOrder(pool, token, { ...ADDRESS, city: "" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws NotFoundError for an order id that does not exist", async () => {
    await expect(getOrder(pool, -1)).rejects.toBeInstanceOf(NotFoundError);
  });
});
