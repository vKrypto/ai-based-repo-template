import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler.js";
import {
  addWishlistItemController,
  getWishlistController,
  removeWishlistItemController
} from "./wishlist.controller.js";

export const wishlistRoutes = Router();
wishlistRoutes.get("/", asyncHandler(getWishlistController));
wishlistRoutes.post("/items", asyncHandler(addWishlistItemController));
wishlistRoutes.delete("/items/:itemId", asyncHandler(removeWishlistItemController));
