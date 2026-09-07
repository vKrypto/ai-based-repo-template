import type { Pool } from "pg";

export async function findSessionId(pool: Pool, token: string): Promise<number | undefined> {
  const result = await pool.query<{ id: number }>("SELECT id FROM customer_session WHERE token = $1", [token]);
  return result.rows[0]?.id;
}

export async function ensureSessionId(pool: Pool, token: string): Promise<number> {
  await pool.query("INSERT INTO customer_session (token) VALUES ($1) ON CONFLICT (token) DO NOTHING", [token]);
  const id = await findSessionId(pool, token);
  if (id === undefined) {
    throw new Error(`failed to resolve session for token: ${token}`);
  }
  return id;
}
