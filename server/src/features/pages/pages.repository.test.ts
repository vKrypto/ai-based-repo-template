import { describe, it, expect, afterAll } from "vitest";
import { Pool } from "pg";
import { findPageBySlug } from "./pages.repository.js";

const pool = new Pool({
  connectionString:
    process.env["DATABASE_URL"] ?? "postgres://barebrilliant:barebrilliant@localhost:5432/barebrilliant"
});

afterAll(async () => {
  await pool.end();
});

describe("pages.repository", () => {
  it("finds a seeded static page by slug", async () => {
    const page = await findPageBySlug(pool, "terms-conditions");

    expect(page?.slug).toBe("terms-conditions");
    expect(page?.title).toBe("Terms & Conditions");
  });

  it("returns undefined for a slug that does not exist", async () => {
    const page = await findPageBySlug(pool, "does-not-exist");

    expect(page).toBeUndefined();
  });
});
