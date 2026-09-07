import runner from "node-pg-migrate";
import { fileURLToPath } from "node:url";
import { getDatabaseUrl } from "./config.js";
import { getMigrationsDir } from "./paths.js";

export async function runMigrations(databaseUrl = getDatabaseUrl()): Promise<number> {
  const migrations = await runner({
    databaseUrl,
    dir: await getMigrationsDir(),
    direction: "up",
    migrationsTable: "pgmigrations",
    log: () => undefined
  });

  return migrations.length;
}

async function main(): Promise<void> {
  const count = await runMigrations();
  console.log(count === 0 ? "database schema is already up to date" : `applied ${count} migration(s)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error("database migration failed", error);
    process.exit(1);
  });
}
