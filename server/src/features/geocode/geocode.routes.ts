import { Router } from "express";
import { reverseGeocodeController } from "./geocode.controller.js";
import { asyncHandler } from "../../shared/http/asyncHandler.js";

export const geocodeRoutes = Router();
geocodeRoutes.get("/reverse", asyncHandler(reverseGeocodeController));
