import type { Pool } from "pg";
import { attributeValueSubquery } from "../../shared/db/attributeSubquery.js";
import type { ProductDetailDTO, VariantSummaryDTO } from "./products.types.js";

interface ProductRow {
  product_id: number;
  item_id: string;
  name: string;
  slug: string;
  price: string;
  compare_at_price: string | null;
  avg_rating: string | null;
  review_count: number;
  metal: string | null;
  diamond_type: string | null;
  total_carat: string | null;
  stone_shape: string | null;
}

interface VariantRow {
  item_id: string;
  slug: string;
  price: string;
  compare_at_price: string | null;
  metal: string | null;
  diamond_type: string | null;
  total_carat: string | null;
  stone_shape: string | null;
}

async function findImagesForVariant(pool: Pool, variantId: number): Promise<string[]> {
  const result = await pool.query<{ url: string }>(
    "SELECT url FROM product_image WHERE variant_id = $1 AND media_type = 'image' ORDER BY position ASC",
    [variantId]
  );
  return result.rows.map((row) => row.url);
}

async function findVideoForVariant(pool: Pool, variantId: number): Promise<string | null> {
  const result = await pool.query<{ url: string }>(
    "SELECT url FROM product_image WHERE variant_id = $1 AND media_type = 'video' LIMIT 1",
    [variantId]
  );
  return result.rows[0]?.url ?? null;
}

async function findSiblingVariants(pool: Pool, productId: number, excludeVariantId: number): Promise<VariantSummaryDTO[]> {
  const result = await pool.query<VariantRow>(
    `SELECT
       pv.item_id,
       pv.slug,
       pv.price::text AS price,
       pv.compare_at_price::text AS compare_at_price,
       ${attributeValueSubquery("display_label", "metal")} AS metal,
       ${attributeValueSubquery("display_label", "diamondType")} AS diamond_type,
       ${attributeValueSubquery("value", "carat")} AS total_carat,
       ${attributeValueSubquery("display_label", "stoneShape")} AS stone_shape
     FROM product_variant pv
     WHERE pv.product_id = $1 AND pv.id != $2
     ORDER BY pv.id ASC`,
    [productId, excludeVariantId]
  );

  return result.rows.map((row) => ({
    itemId: row.item_id,
    slug: row.slug,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price === null ? null : Number(row.compare_at_price),
    metal: row.metal,
    diamondType: row.diamond_type,
    totalCarat: row.total_carat === null ? null : Number(row.total_carat),
    stoneShape: row.stone_shape
  }));
}

export async function findProductByItemId(pool: Pool, itemId: string): Promise<ProductDetailDTO | undefined> {
  const result = await pool.query<ProductRow & { variant_id: number }>(
    `SELECT
       p.id AS product_id,
       pv.id AS variant_id,
       pv.item_id,
       p.name,
       pv.slug,
       pv.price::text AS price,
       pv.compare_at_price::text AS compare_at_price,
       p.avg_rating::text AS avg_rating,
       p.review_count,
       ${attributeValueSubquery("display_label", "metal")} AS metal,
       ${attributeValueSubquery("display_label", "diamondType")} AS diamond_type,
       ${attributeValueSubquery("value", "carat")} AS total_carat,
       ${attributeValueSubquery("display_label", "stoneShape")} AS stone_shape
     FROM product_variant pv
     JOIN product p ON p.id = pv.product_id
     WHERE pv.item_id = $1`,
    [itemId]
  );

  const row = result.rows[0];
  if (!row) {
    return undefined;
  }

  const [images, video, siblingVariants] = await Promise.all([
    findImagesForVariant(pool, row.variant_id),
    findVideoForVariant(pool, row.variant_id),
    findSiblingVariants(pool, row.product_id, row.variant_id)
  ]);

  return {
    productId: row.product_id,
    itemId: row.item_id,
    name: row.name,
    slug: row.slug,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price === null ? null : Number(row.compare_at_price),
    images,
    video,
    metal: row.metal,
    diamondType: row.diamond_type,
    totalCarat: row.total_carat === null ? null : Number(row.total_carat),
    stoneShape: row.stone_shape,
    avgRating: row.avg_rating === null ? null : Number(row.avg_rating),
    reviewCount: row.review_count,
    siblingVariants
  };
}
