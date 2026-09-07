import { describe, it, expect, afterAll } from "vitest";
import { Pool } from "pg";
import { getPageBySlug } from "./pages.service.js";
import { NotFoundError } from "../../shared/errors/index.js";

const pool = new Pool({
  connectionString:
    process.env["DATABASE_URL"] ?? "postgres://barebrilliant:barebrilliant@localhost:5432/barebrilliant"
});

afterAll(async () => {
  await pool.end();
});

describe("pages.service", () => {
  it("returns the seeded page for a known slug", async () => {
    const page = await getPageBySlug(pool, "about-us");

    expect(page.title).toBe("About Us");
  });

  it("throws NotFoundError for an unknown slug", async () => {
    await expect(getPageBySlug(pool, "does-not-exist")).rejects.toBeInstanceOf(NotFoundError);
  });
});
