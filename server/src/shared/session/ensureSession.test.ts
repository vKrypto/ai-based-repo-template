import { describe, it, expect, afterAll } from "vitest";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { ensureSessionId, findSessionId } from "./ensureSession.js";

const pool = new Pool({
  connectionString:
    process.env["DATABASE_URL"] ?? "postgres://barebrilliant:barebrilliant@localhost:5432/barebrilliant"
});

afterAll(async () => {
  await pool.end();
});

describe("findSessionId", () => {
  it("returns undefined for a token that has never been seen", async () => {
    expect(await findSessionId(pool, `unknown-${randomUUID()}`)).toBeUndefined();
  });
});

describe("ensureSessionId", () => {
  it("creates a new session row for a fresh token and returns its id", async () => {
    const token = `test-${randomUUID()}`;
    const id = await ensureSessionId(pool, token);

    expect(id).toEqual(expect.any(Number));
    expect(await findSessionId(pool, token)).toBe(id);
  });

  it("is idempotent: calling it again for the same token returns the same id", async () => {
    const token = `test-${randomUUID()}`;
    const first = await ensureSessionId(pool, token);
    const second = await ensureSessionId(pool, token);

    expect(second).toBe(first);
  });
});
