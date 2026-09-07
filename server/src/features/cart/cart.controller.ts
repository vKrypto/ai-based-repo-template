import type { Request, Response } from "express";
import { dbPool } from "../../shared/db/pool.js";
import { ValidationError } from "../../shared/errors/index.js";
import { addCartItem, getCart, removeFromCart, updateCartItemQuantity } from "./cart.service.js";

function parseItemId(body: unknown): string {
  const itemId = (body as { itemId?: unknown } | null)?.itemId;
  if (typeof itemId !== "string" || itemId.trim() === "") {
    throw new ValidationError("itemId is required");
  }
  return itemId;
}

function parseQuantity(body: unknown, fallback: number): number {
  const quantity = (body as { quantity?: unknown } | null)?.quantity;
  if (quantity === undefined) {
    return fallback;
  }
  if (typeof quantity !== "number") {
    throw new ValidationError("quantity must be a number");
  }
  return quantity;
}

export async function getCartController(req: Request, res: Response): Promise<void> {
  const cart = await getCart(dbPool, req.sessionToken);
  res.status(200).json(cart);
}

export async function addCartItemController(req: Request, res: Response): Promise<void> {
  const itemId = parseItemId(req.body);
  const quantity = parseQuantity(req.body, 1);

  const cart = await addCartItem(dbPool, req.sessionToken, itemId, quantity);
  res.status(200).json(cart);
}

export async function updateCartItemController(req: Request, res: Response): Promise<void> {
  const itemId = req.params["itemId"] ?? "";
  const quantity = parseQuantity(req.body, Number.NaN);
  if (Number.isNaN(quantity)) {
    throw new ValidationError("quantity is required");
  }

  const cart = await updateCartItemQuantity(dbPool, req.sessionToken, itemId, quantity);
  res.status(200).json(cart);
}

export async function removeCartItemController(req: Request, res: Response): Promise<void> {
  const itemId = req.params["itemId"] ?? "";
  const cart = await removeFromCart(dbPool, req.sessionToken, itemId);
  res.status(200).json(cart);
}
