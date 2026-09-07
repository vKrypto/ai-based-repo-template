import { describe, it, expect, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import { pagesRoutes } from "./pages.routes.js";
import { dbPool } from "../../shared/db/pool.js";

afterAll(async () => {
  await dbPool.end();
});

describe("pagesRoutes", () => {
  it("responds 200 with the seeded page content for a known slug", async () => {
    const app = express();
    app.use("/api/pages", pagesRoutes);

    const response = await request(app).get("/api/pages/shipping-returns");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ slug: "shipping-returns", title: "Shipping & Returns" });
  });

  it("responds 404 for a slug that does not exist", async () => {
    const app = express();
    app.use("/api/pages", pagesRoutes);

    const response = await request(app).get("/api/pages/does-not-exist");

    expect(response.status).toBe(404);
  });
});
