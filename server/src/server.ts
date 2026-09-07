import "dotenv/config";
import { createApp } from "./app.js";
import { initializeDatabase } from "./shared/db/init.js";
import { dbPool } from "./shared/db/pool.js";

const port = Number(process.env["PORT"] ?? 4000);

async function main(): Promise<void> {
  await initializeDatabase();
  await dbPool.query("SELECT 1");
  const app = createApp();
  app.listen(port, () => {
    console.log(`server listening on port ${port}`);
  });
}

main().catch((error: unknown) => {
  console.error("failed to start server", error);
  process.exit(1);
});
