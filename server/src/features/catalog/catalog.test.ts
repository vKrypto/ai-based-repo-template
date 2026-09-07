import { describe, it, expect, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import { catalogRoutes } from "./catalog.routes.js";
import { dbPool } from "../../shared/db/pool.js";
import { errorHandler } from "../../shared/http/errorHandler.js";

afterAll(async () => {
  await dbPool.end();
});

describe("catalogRoutes", () => {
  it("responds 200 with a paginated product list for a known category slug", async () => {
    const app = express();
    app.use("/api/categories", catalogRoutes);
    app.use(errorHandler);

    const response = await request(app).get("/api/categories/wedding-rings/products?pageSize=5");

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(5);
    expect(response.body.total).toBeGreaterThanOrEqual(1000);
    expect(response.body.availableFilters.length).toBeGreaterThan(0);
  });

  it("applies filter query params", async () => {
    const app = express();
    app.use("/api/categories", catalogRoutes);
    app.use(errorHandler);

    const response = await request(app).get(
      "/api/categories/wedding-rings/products?metal=Platinum&pageSize=500"
    );

    expect(response.status).toBe(200);
    expect(
      (response.body.items as Array<{ metal: string }>).every((item) => item.metal === "Platinum")
    ).toBe(true);
  });

  it("responds 404 for an unknown category slug", async () => {
    const app = express();
    app.use("/api/categories", catalogRoutes);
    app.use(errorHandler);

    const response = await request(app).get("/api/categories/does-not-exist/products");

    expect(response.status).toBe(404);
  });
});
