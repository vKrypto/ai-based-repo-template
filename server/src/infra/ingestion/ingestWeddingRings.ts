import "dotenv/config";
import { dbPool } from "../../shared/db/pool.js";
import { parseSsrDataHtml } from "./parseSsrData.js";
import { mapBlueNileProduct } from "./mapBlueNileProduct.js";
import { generateSyntheticProducts } from "./syntheticProducts.js";
import { upsertWeddingRingsCatalog } from "./upsertCatalog.js";
import type { IngestedProduct } from "./types.js";

const TARGET_PRODUCT_COUNT = 1000;
const REQUEST_DELAY_MS = 1500;

// Only these two query params were found as real, hardcoded links on bluenile.com/wedding-rings.
// True pagination beyond ~32 results per view requires their service-api/web-api endpoints,
// which robots.txt explicitly disallows for crawlers, so we deliberately stop at these three views.
const SOURCE_URLS = [
  "https://www.bluenile.com/wedding-rings",
  "https://www.bluenile.com/wedding-rings?Diamonds=Lab",
  "https://www.bluenile.com/wedding-rings?Diamonds=Dia"
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRealProducts(): Promise<IngestedProduct[]> {
  const byItemId = new Map<string, IngestedProduct>();

  for (const url of SOURCE_URLS) {
    const response = await fetch(url, { headers: { "User-Agent": "BareBrilliantIngestionBot/1.0" } });
    if (!response.ok) {
      console.warn(`skipping ${url}: HTTP ${response.status}`);
      continue;
    }
    const html = await response.text();
    for (const raw of parseSsrDataHtml(html)) {
      const product = mapBlueNileProduct(raw);
      byItemId.set(product.itemId, product);
    }
    await delay(REQUEST_DELAY_MS);
  }

  return [...byItemId.values()];
}

async function main(): Promise<void> {
  const realProducts = await fetchRealProducts();
  console.log(`fetched ${realProducts.length} real products`);

  const syntheticCount = Math.max(TARGET_PRODUCT_COUNT - realProducts.length, 0);
  const syntheticProducts = generateSyntheticProducts(syntheticCount);
  console.log(`generated ${syntheticProducts.length} synthetic products`);

  await upsertWeddingRingsCatalog(dbPool, [...realProducts, ...syntheticProducts]);
  console.log(`ingested ${realProducts.length + syntheticProducts.length} total products`);

  await dbPool.end();
}

main().catch((error: unknown) => {
  console.error("ingestion failed", error);
  process.exit(1);
});
