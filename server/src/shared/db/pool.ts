import { Pool } from "pg";
import { getDatabaseUrl } from "./config.js";

export function createDbPool(connectionString: string): Pool {
  return new Pool({ connectionString });
}

export const dbPool = createDbPool(getDatabaseUrl());
