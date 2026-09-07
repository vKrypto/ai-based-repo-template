import { Client } from "pg";
import { fileURLToPath } from "node:url";
import { getDatabaseUrl } from "./config.js";
import { ensureDatabaseExists } from "./database.js";
import { runMigrations } from "./migrate.js";
import { populateDemoData } from "./populate.js";

async function hasMigrationTable(databaseUrl: string): Promise<boolean> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const result = await client.query<{ exists: boolean }>("SELECT to_regclass('public.pgmigrations') IS NOT NULL AS exists");
    return result.rows[0]?.exists ?? false;
  } finally {
    await client.end();
  }
}

async function hasApplicationTables(databaseUrl: string): Promise<boolean> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const result = await client.query<{ count: string }>(
      `SELECT count(*) AS count
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'
         AND table_name <> 'pgmigrations'`
    );
    return Number(result.rows[0]?.count ?? 0) > 0;
  } finally {
    await client.end();
  }
}

export async function initializeDatabase(databaseUrl = getDatabaseUrl()): Promise<void> {
  const createdDatabase = await ensureDatabaseExists(databaseUrl);
  const shouldPopulateDemoData =
    createdDatabase || (!(await hasMigrationTable(databaseUrl)) && !(await hasApplicationTables(databaseUrl)));

  const migrationsRun = await runMigrations(databaseUrl);
  if (migrationsRun > 0) {
    console.log(`applied ${migrationsRun} database migration(s)`);
  }

  if (shouldPopulateDemoData) {
    await populateDemoData(databaseUrl);
    console.log("populated demo data for newly initialized database");
  }
}

async function main(): Promise<void> {
  await initializeDatabase();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error("database initialization failed", error);
    process.exit(1);
  });
}
