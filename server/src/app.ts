import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import { catalogRoutes } from "./features/catalog/catalog.routes.js";
import { productsRoutes } from "./features/products/products.routes.js";
import { pagesRoutes } from "./features/pages/pages.routes.js";
import { cartRoutes } from "./features/cart/cart.routes.js";
import { wishlistRoutes } from "./features/wishlist/wishlist.routes.js";
import { ordersRoutes } from "./features/orders/orders.routes.js";
import { geocodeRoutes } from "./features/geocode/geocode.routes.js";
import { attachSessionToken } from "./shared/session/sessionCookie.js";
import { errorHandler } from "./shared/http/errorHandler.js";

export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(attachSessionToken);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/categories", catalogRoutes);
  app.use("/api/products", productsRoutes);
  app.use("/api/pages", pagesRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/orders", ordersRoutes);
  app.use("/api/geocode", geocodeRoutes);

  app.use(errorHandler);

  return app;
}
