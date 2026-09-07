import { Router } from "express";
import { getPageController } from "./pages.controller.js";
import { asyncHandler } from "../../shared/http/asyncHandler.js";

export const pagesRoutes = Router();
pagesRoutes.get("/:slug", asyncHandler(getPageController));
