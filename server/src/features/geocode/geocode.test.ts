import { describe, it, expect, vi, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { geocodeRoutes } from "./geocode.routes.js";
import { errorHandler } from "../../shared/http/errorHandler.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("geocodeRoutes", () => {
  it("responds 200 with a normalized address for valid coordinates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            address: { road: "Main St", house_number: "1", city: "Springfield", state: "IL", postcode: "62701", country: "USA" }
          })
      })
    );

    const app = express();
    app.use("/api/geocode", geocodeRoutes);

    const response = await request(app).get("/api/geocode/reverse?lat=39.78&lng=-89.65");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      line1: "1 Main St",
      city: "Springfield",
      state: "IL",
      postalCode: "62701",
      country: "USA"
    });
  });

  it("responds 400 when lat/lng are missing", async () => {
    const app = express();
    app.use("/api/geocode", geocodeRoutes);
    app.use(errorHandler);

    const response = await request(app).get("/api/geocode/reverse");

    expect(response.status).toBe(400);
  });
});
