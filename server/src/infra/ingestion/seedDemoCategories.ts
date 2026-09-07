import "dotenv/config";
import { dbPool } from "../../shared/db/pool.js";
import { generateSyntheticProducts } from "./syntheticProducts.js";
import { upsertWeddingRingsCatalog } from "./upsertCatalog.js";

const PRODUCTS_PER_CATEGORY = 100;

interface DemoCategory {
  slug: string;
  name: string;
  itemNoun: string;
}

const DEMO_CATEGORIES: DemoCategory[] = [
  { slug: "engagement-rings", name: "Engagement Rings", itemNoun: "Engagement Ring" },
  { slug: "rings", name: "Rings", itemNoun: "Ring" },
  { slug: "earrings", name: "Earrings", itemNoun: "Earrings" },
  { slug: "bracelets", name: "Bracelets", itemNoun: "Bracelet" },
  { slug: "necklaces", name: "Necklaces", itemNoun: "Necklace" },
  { slug: "diamonds", name: "Diamonds", itemNoun: "Diamond" },
  { slug: "gemstones", name: "Gemstones", itemNoun: "Gemstone Ring" },
  { slug: "gifts", name: "Gifts", itemNoun: "Gift Set" }
];

async function main(): Promise<void> {
  for (const category of DEMO_CATEGORIES) {
    const idPrefix = `DEMO-${category.slug.toUpperCase()}`;
    const products = generateSyntheticProducts(PRODUCTS_PER_CATEGORY, { itemNoun: category.itemNoun, idPrefix });
    await upsertWeddingRingsCatalog(dbPool, products, category.slug, category.name);
    console.log(`seeded ${products.length} demo products into ${category.slug}`);
  }
  await dbPool.end();
}

main().catch((error: unknown) => {
  console.error("demo category seeding failed", error);
  process.exit(1);
});
