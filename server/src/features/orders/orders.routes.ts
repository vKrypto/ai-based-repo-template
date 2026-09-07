import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler.js";
import { getOrderController, placeOrderController } from "./orders.controller.js";

export const ordersRoutes = Router();
ordersRoutes.post("/", asyncHandler(placeOrderController));
ordersRoutes.get("/:orderId", asyncHandler(getOrderController));
