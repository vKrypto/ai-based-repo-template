import { Client } from "pg";

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function databaseNameFromUrl(databaseUrl: string): string {
  const parsed = new URL(databaseUrl);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!databaseName) {
    throw new Error("DATABASE_URL must include a database name");
  }
  return databaseName;
}

function maintenanceDatabaseUrl(databaseUrl: string): string {
  const parsed = new URL(databaseUrl);
  parsed.pathname = "/postgres";
  return parsed.toString();
}

export async function ensureDatabaseExists(databaseUrl: string): Promise<boolean> {
  const databaseName = databaseNameFromUrl(databaseUrl);
  const client = new Client({ connectionString: maintenanceDatabaseUrl(databaseUrl) });

  await client.connect();
  try {
    const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [databaseName]);
    if (existing.rowCount !== 0) {
      return false;
    }

    await client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    return true;
  } finally {
    await client.end();
  }
}
