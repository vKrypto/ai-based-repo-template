import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { getDatabaseUrl } from "./config.js";
import { getDemoSeedPath } from "./paths.js";

const APP_TABLES = [
  "public.cart_item",
  "public.wishlist_item",
  "public.customer_order_item",
  "public.customer_order",
  "public.customer_session",
  "public.variant_attribute_value",
  "public.product_image",
  "public.product_variant",
  "public.product",
  "public.attribute_value",
  "public.attribute",
  "public.category",
  "public.static_page"
];

export async function populateDemoData(databaseUrl = getDatabaseUrl()): Promise<void> {
  const seedSql = await readFile(await getDemoSeedPath(), "utf8");
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(`TRUNCATE ${APP_TABLES.join(", ")} RESTART IDENTITY CASCADE`);
    await client.query(seedSql);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  await populateDemoData();
  console.log("demo data populated");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error("demo data population failed", error);
    process.exit(1);
  });
}
