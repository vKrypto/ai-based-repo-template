import type { Request, Response } from "express";
import { dbPool } from "../../shared/db/pool.js";
import { getPageBySlug } from "./pages.service.js";
import { NotFoundError } from "../../shared/errors/index.js";

export async function getPageController(req: Request, res: Response): Promise<void> {
  try {
    const page = await getPageBySlug(dbPool, req.params["slug"] ?? "");
    res.status(200).json(page);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    }
    throw error;
  }
}
