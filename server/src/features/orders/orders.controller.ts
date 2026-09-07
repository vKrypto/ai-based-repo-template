import type { Request, Response } from "express";
import { dbPool } from "../../shared/db/pool.js";
import { ValidationError } from "../../shared/errors/index.js";
import { getOrder, placeOrder } from "./orders.service.js";
import type { ShippingAddressInput } from "./orders.types.js";

function parseShippingAddress(body: unknown): ShippingAddressInput {
  const address = (body as { shippingAddress?: unknown } | null)?.shippingAddress;
  if (!address || typeof address !== "object") {
    throw new ValidationError("shippingAddress is required");
  }
  return address as ShippingAddressInput;
}

function parseOrderId(raw: string): number {
  const orderId = Number(raw);
  if (!Number.isInteger(orderId)) {
    throw new ValidationError("orderId must be an integer");
  }
  return orderId;
}

export async function placeOrderController(req: Request, res: Response): Promise<void> {
  const address = parseShippingAddress(req.body);
  const order = await placeOrder(dbPool, req.sessionToken, address);
  res.status(201).json(order);
}

export async function getOrderController(req: Request, res: Response): Promise<void> {
  const orderId = parseOrderId(req.params["orderId"] ?? "");
  const order = await getOrder(dbPool, orderId);
  res.status(200).json(order);
}
