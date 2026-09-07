import type { NextFunction, Request, Response } from "express";
import { NotFoundError, ValidationError } from "../errors/index.js";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof NotFoundError) {
    res.status(404).json({ message: error.message });
    return;
  }
  if (error instanceof ValidationError) {
    res.status(400).json({ message: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
}
