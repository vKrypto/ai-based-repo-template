import { describe, it, expect, afterAll } from "vitest";
import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import request from "supertest";
import { ordersRoutes } from "./orders.routes.js";
import { cartRoutes } from "../cart/cart.routes.js";
import { attachSessionToken } from "../../shared/session/sessionCookie.js";
import { errorHandler } from "../../shared/http/errorHandler.js";
import { dbPool } from "../../shared/db/pool.js";

afterAll(async () => {
  await dbPool.end();
});

const ADDRESS = {
  name: "Ada Lovelace",
  line1: "123 Analytical Engine Ave",
  city: "London",
  state: "England",
  postalCode: "SW1A 1AA",
  country: "United Kingdom"
};

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(attachSessionToken);
  app.use("/api/cart", cartRoutes);
  app.use("/api/orders", ordersRoutes);
  app.use(errorHandler);
  return app;
}

describe("ordersRoutes", () => {
  it("places an order from the session's cart and can fetch it back", async () => {
    const agent = request.agent(buildApp());
    await agent.post("/api/cart/items").send({ itemId: "241257", quantity: 1 });

    const placeResponse = await agent.post("/api/orders").send({ shippingAddress: ADDRESS });
    expect(placeResponse.status).toBe(201);
    expect(placeResponse.body.items).toHaveLength(1);

    const getResponse = await agent.get(`/api/orders/${placeResponse.body.orderId}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.orderId).toBe(placeResponse.body.orderId);

    const cartAfter = await agent.get("/api/cart");
    expect(cartAfter.body.items).toEqual([]);
  });

  it("responds 400 when placing an order with an empty cart", async () => {
    const response = await request(buildApp()).post("/api/orders").send({ shippingAddress: ADDRESS });
    expect(response.status).toBe(400);
  });

  it("responds 404 for an unknown order id", async () => {
    const response = await request(buildApp()).get("/api/orders/999999999");
    expect(response.status).toBe(404);
  });
});
