import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler.js";
import {
  addCartItemController,
  getCartController,
  removeCartItemController,
  updateCartItemController
} from "./cart.controller.js";

export const cartRoutes = Router();
cartRoutes.get("/", asyncHandler(getCartController));
cartRoutes.post("/items", asyncHandler(addCartItemController));
cartRoutes.patch("/items/:itemId", asyncHandler(updateCartItemController));
cartRoutes.delete("/items/:itemId", asyncHandler(removeCartItemController));
