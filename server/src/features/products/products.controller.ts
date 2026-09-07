import type { Request, Response } from "express";
import { dbPool } from "../../shared/db/pool.js";
import { getProductByItemId } from "./products.service.js";

export async function getProductController(req: Request, res: Response): Promise<void> {
  const itemId = req.params["itemId"] ?? "";

  const product = await getProductByItemId(dbPool, itemId);
  res.status(200).json(product);
}
