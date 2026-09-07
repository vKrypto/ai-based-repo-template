import { describe, it, expect, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import { productsRoutes } from "./products.routes.js";
import { dbPool } from "../../shared/db/pool.js";
import { errorHandler } from "../../shared/http/errorHandler.js";

afterAll(async () => {
  await dbPool.end();
});

describe("productsRoutes", () => {
  it("responds 200 with product detail for a known item id", async () => {
    const app = express();
    app.use("/api/products", productsRoutes);
    app.use(errorHandler);

    const response = await request(app).get("/api/products/241257");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ itemId: "241257" });
    expect(Array.isArray(response.body.images)).toBe(true);
    expect(Array.isArray(response.body.siblingVariants)).toBe(true);
  });

  it("responds 404 for an unknown item id", async () => {
    const app = express();
    app.use("/api/products", productsRoutes);
    app.use(errorHandler);

    const response = await request(app).get("/api/products/does-not-exist");

    expect(response.status).toBe(404);
  });
});
