import type { Request, Response } from "express";
import { dbPool } from "../../shared/db/pool.js";
import { ValidationError } from "../../shared/errors/index.js";
import { addToWishlist, getWishlist, removeFromWishlist } from "./wishlist.service.js";

function parseItemId(body: unknown): string {
  const itemId = (body as { itemId?: unknown } | null)?.itemId;
  if (typeof itemId !== "string" || itemId.trim() === "") {
    throw new ValidationError("itemId is required");
  }
  return itemId;
}

export async function getWishlistController(req: Request, res: Response): Promise<void> {
  const wishlist = await getWishlist(dbPool, req.sessionToken);
  res.status(200).json(wishlist);
}

export async function addWishlistItemController(req: Request, res: Response): Promise<void> {
  const itemId = parseItemId(req.body);
  const wishlist = await addToWishlist(dbPool, req.sessionToken, itemId);
  res.status(200).json(wishlist);
}

export async function removeWishlistItemController(req: Request, res: Response): Promise<void> {
  const itemId = req.params["itemId"] ?? "";
  const wishlist = await removeFromWishlist(dbPool, req.sessionToken, itemId);
  res.status(200).json(wishlist);
}
