import { describe, it, expect, afterAll } from "vitest";
import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import request from "supertest";
import { wishlistRoutes } from "./wishlist.routes.js";
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
  app.use("/api/wishlist", wishlistRoutes);
  app.use(errorHandler);
  return app;
}

describe("wishlistRoutes", () => {
  it("returns an empty wishlist for a first-time visitor", async () => {
    const response = await request(buildApp()).get("/api/wishlist");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [] });
  });

  it("adds an item, persists it across requests, and removes it", async () => {
    const agent = request.agent(buildApp());

    const afterAdd = await agent.post("/api/wishlist/items").send({ itemId: "241257" });
    expect(afterAdd.status).toBe(200);
    expect(afterAdd.body.items).toHaveLength(1);

    const afterGet = await agent.get("/api/wishlist");
    expect(afterGet.body.items).toHaveLength(1);

    const afterRemove = await agent.delete("/api/wishlist/items/241257");
    expect(afterRemove.body.items).toEqual([]);
  });

  it("responds 404 when adding an unknown item id", async () => {
    const response = await request(buildApp()).post("/api/wishlist/items").send({ itemId: "does-not-exist" });
    expect(response.status).toBe(404);
  });

  it("responds 400 when itemId is missing", async () => {
    const response = await request(buildApp()).post("/api/wishlist/items").send({});
    expect(response.status).toBe(400);
  });
});
