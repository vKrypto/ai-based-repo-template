import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("createApp", () => {
  it("responds ok on the health check route", async () => {
    const response = await request(createApp()).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
