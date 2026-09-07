import { Router } from "express";
import { getProductController } from "./products.controller.js";
import { asyncHandler } from "../../shared/http/asyncHandler.js";

export const productsRoutes = Router();
productsRoutes.get("/:itemId", asyncHandler(getProductController));
