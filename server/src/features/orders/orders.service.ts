import type { Pool } from "pg";
import { findSessionId } from "../../shared/session/ensureSession.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { clearCartItems, createOrder, findCartItemsForSession, findOrderById } from "./orders.repository.js";
import type { OrderDTO, ShippingAddressInput } from "./orders.types.js";

const REQUIRED_ADDRESS_FIELDS: Array<keyof ShippingAddressInput> = [
  "name",
  "line1",
  "city",
  "state",
  "postalCode",
  "country"
];

function validateAddress(address: ShippingAddressInput): void {
  for (const field of REQUIRED_ADDRESS_FIELDS) {
    if (!address[field] || String(address[field]).trim() === "") {
      throw new ValidationError(`${field} is required`);
    }
  }
}

export async function placeOrder(pool: Pool, token: string, address: ShippingAddressInput): Promise<OrderDTO> {
  validateAddress(address);

  const sessionId = await findSessionId(pool, token);
  if (sessionId === undefined) {
    throw new ValidationError("cart is empty");
  }

  const lines = await findCartItemsForSession(pool, sessionId);
  if (lines.length === 0) {
    throw new ValidationError("cart is empty");
  }

  const orderId = await createOrder(pool, sessionId, address, lines);
  await clearCartItems(pool, sessionId);

  const order = await findOrderById(pool, orderId);
  if (!order) {
    throw new Error(`failed to load newly created order: ${orderId}`);
  }
  return order;
}

export async function getOrder(pool: Pool, orderId: number): Promise<OrderDTO> {
  const order = await findOrderById(pool, orderId);
  if (!order) {
    throw new NotFoundError(`order not found: ${orderId}`);
  }
  return order;
}
