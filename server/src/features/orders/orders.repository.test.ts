import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { ensureSessionId } from "../../shared/session/ensureSession.js";
import { findVariantIdByItemId } from "../../shared/catalog/variantLookup.js";
import {
  findCartItemsForSession,
  createOrder,
  clearCartItems,
  findOrderById
} from "./orders.repository.js";
import type { ShippingAddressInput } from "./orders.types.js";

const pool = new Pool({
  connectionString:
    process.env["DATABASE_URL"] ?? "postgres://barebrilliant:barebrilliant@localhost:5432/barebrilliant"
});

let sessionId: number;
let variantId: number;

const ADDRESS: ShippingAddressInput = {
  name: "Ada Lovelace",
  line1: "123 Analytical Engine Ave",
  city: "London",
  state: "England",
  postalCode: "SW1A 1AA",
  country: "United Kingdom"
};

beforeAll(async () => {
  sessionId = await ensureSessionId(pool, `orders-repo-test-${randomUUID()}`);
  variantId = (await findVariantIdByItemId(pool, "241257"))!;
  await pool.query("INSERT INTO cart_item (session_id, variant_id, quantity) VALUES ($1, $2, $3)", [
    sessionId,
    variantId,
    2
  ]);
});

afterAll(async () => {
  await pool.end();
});

describe("orders.repository", () => {
  it("finds cart items for a session shaped for order snapshotting", async () => {
    const lines = await findCartItemsForSession(pool, sessionId);

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ itemId: "241257", quantity: 2, variantId });
  });

  it("creates an order with a snapshot of the cart lines and the shipping address", async () => {
    const lines = await findCartItemsForSession(pool, sessionId);
    const orderId = await createOrder(pool, sessionId, ADDRESS, lines);

    const order = await findOrderById(pool, orderId);
    expect(order?.shippingAddress).toMatchObject({ name: "Ada Lovelace", city: "London" });
    expect(order?.items).toHaveLength(1);
    expect(order?.items[0]).toMatchObject({ itemId: "241257", quantity: 2 });
    expect(order?.subtotal).toBe(order?.items[0]!.lineTotal);
  });

  it("returns undefined for an order id that does not exist", async () => {
    expect(await findOrderById(pool, -1)).toBeUndefined();
  });

  it("clears all cart items for a session", async () => {
    await clearCartItems(pool, sessionId);
    expect(await findCartItemsForSession(pool, sessionId)).toEqual([]);
  });
});
