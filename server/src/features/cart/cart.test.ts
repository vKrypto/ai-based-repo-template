import { describe, it, expect, afterAll } from "vitest";
import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import request from "supertest";
import { cartRoutes } from "./cart.routes.js";
import { attachSessionToken } from "../../shared/session/sessionCookie.js";
import { errorHandler } from "../../shared/http/errorHandler.js";
import { dbPool } from "../../shared/db/pool.js";

afterAll(async () => {
  await dbPool.end();
});

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(attachSessionToken);
  app.use("/api/cart", cartRoutes);
  app.use(errorHandler);
  return app;
}

describe("cartRoutes", () => {
  it("returns an empty cart for a first-time visitor and sets a session cookie", async () => {
    const response = await request(buildApp()).get("/api/cart");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], itemCount: 0, subtotal: 0 });
    expect(response.headers["set-cookie"]?.[0]).toContain("bb_session=");
  });

  it("adds an item, persists it across requests using the session cookie, updates and removes it", async () => {
    const agent = request.agent(buildApp());

    const afterAdd = await agent.post("/api/cart/items").send({ itemId: "241257", quantity: 2 });
    expect(afterAdd.status).toBe(200);
    expect(afterAdd.body.items).toHaveLength(1);
    expect(afterAdd.body.items[0]).toMatchObject({ itemId: "241257", quantity: 2 });

    const afterGet = await agent.get("/api/cart");
    expect(afterGet.body.items[0]?.quantity).toBe(2);

    const afterUpdate = await agent.patch("/api/cart/items/241257").send({ quantity: 5 });
    expect(afterUpdate.body.items[0]?.quantity).toBe(5);

    const afterRemove = await agent.delete("/api/cart/items/241257");
    expect(afterRemove.body.items).toEqual([]);
  });

  it("responds 404 when adding an unknown item id", async () => {
    const response = await request(buildApp()).post("/api/cart/items").send({ itemId: "does-not-exist" });
    expect(response.status).toBe(404);
  });

  it("responds 400 when itemId is missing", async () => {
    const response = await request(buildApp()).post("/api/cart/items").send({});
    expect(response.status).toBe(400);
  });
});
