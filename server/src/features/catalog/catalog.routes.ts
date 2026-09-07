import { Router } from "express";
import { listCategoryProducts } from "./catalog.controller.js";
import { asyncHandler } from "../../shared/http/asyncHandler.js";

export const catalogRoutes = Router();
catalogRoutes.get("/:slug/products", asyncHandler(listCategoryProducts));
