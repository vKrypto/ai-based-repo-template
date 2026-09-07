import type { Request, Response } from "express";
import { ValidationError } from "../../shared/errors/index.js";
import { reverseGeocode } from "./geocode.service.js";

export async function reverseGeocodeController(req: Request, res: Response): Promise<void> {
  const latRaw = req.query["lat"];
  const lngRaw = req.query["lng"];

  if (typeof latRaw !== "string" || typeof lngRaw !== "string") {
    throw new ValidationError("lat and lng query params are required");
  }

  const address = await reverseGeocode(Number(latRaw), Number(lngRaw));
  res.status(200).json(address);
}
