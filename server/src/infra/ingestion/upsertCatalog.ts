import type { Pool } from "pg";
import type { IngestedProduct } from "./types.js";

interface AttributeDefinition {
  name: string;
  filterKey: string;
}

const ATTRIBUTES = {
  metal: { name: "Metal Type", filterKey: "metal" },
  diamondType: { name: "Diamond Type", filterKey: "diamondType" },
  carat: { name: "Total Carat Weight", filterKey: "carat" },
  stoneShape: { name: "Stone Shape", filterKey: "stoneShape" }
} satisfies Record<string, AttributeDefinition>;

async function ensureCategory(pool: Pool, slug: string, name: string): Promise<number> {
  await pool.query("INSERT INTO category (slug, name) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING", [slug, name]);
  const result = await pool.query<{ id: number }>("SELECT id FROM category WHERE slug = $1", [slug]);
  const row = result.rows[0];
  if (!row) {
    throw new Error(`failed to create category: ${slug}`);
  }
  return row.id;
}

async function ensureAttributeValue(
  pool: Pool,
  attributeKey: keyof typeof ATTRIBUTES,
  value: string
): Promise<number> {
  const definition = ATTRIBUTES[attributeKey];

  await pool.query("INSERT INTO attribute (name, filter_key) VALUES ($1, $2) ON CONFLICT (filter_key) DO NOTHING", [
    definition.name,
    definition.filterKey
  ]);
  const attributeResult = await pool.query<{ id: number }>("SELECT id FROM attribute WHERE filter_key = $1", [
    definition.filterKey
  ]);
  const attributeRow = attributeResult.rows[0];
  if (!attributeRow) {
    throw new Error(`failed to create attribute: ${definition.filterKey}`);
  }

  await pool.query(
    "INSERT INTO attribute_value (attribute_id, value, display_label) VALUES ($1, $2, $2) ON CONFLICT (attribute_id, value) DO NOTHING",
    [attributeRow.id, value]
  );
  const valueResult = await pool.query<{ id: number }>(
    "SELECT id FROM attribute_value WHERE attribute_id = $1 AND value = $2",
    [attributeRow.id, value]
  );
  const valueRow = valueResult.rows[0];
  if (!valueRow) {
    throw new Error(`failed to create attribute value: ${attributeKey}=${value}`);
  }
  return valueRow.id;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

async function findExistingProductIdByBaseSlug(
  pool: Pool,
  categoryId: number,
  baseSlug: string
): Promise<number | undefined> {
  const result = await pool.query<{ id: number }>("SELECT id FROM product WHERE category_id = $1 AND base_slug = $2", [
    categoryId,
    baseSlug
  ]);
  return result.rows[0]?.id;
}

async function upsertProduct(pool: Pool, categoryId: number, product: IngestedProduct): Promise<void> {
  const existing = await pool.query<{ id: number; product_id: number }>(
    "SELECT id, product_id FROM product_variant WHERE item_id = $1",
    [product.itemId]
  );

  let productId: number;
  let variantId: number;
  // Grouped (synthetic) products share one generic name across metal siblings, so the metal
  // has to be folded back into the per-variant slug. Ungrouped (real) products already bake
  // the metal into their scraped name, so appending it again would duplicate it in the URL.
  const variantSlug = product.groupKey
    ? slugify(`${product.name} in ${product.metalType}`)
    : slugify(product.name);

  if (existing.rows[0]) {
    productId = existing.rows[0].product_id;
    variantId = existing.rows[0].id;
    await pool.query(
      "UPDATE product SET name = $1, source_url = $2, is_synthetic = $3, updated_at = now() WHERE id = $4",
      [product.name, product.sourceUrl, product.isSynthetic, productId]
    );
    await pool.query("UPDATE product_variant SET price = $1, slug = $2, compare_at_price = $3 WHERE id = $4", [
      product.price,
      variantSlug,
      product.compareAtPrice,
      variantId
    ]);
  } else {
    const baseSlug = product.groupKey ?? slugify(product.name);
    const resolvedProductId = product.groupKey
      ? await findExistingProductIdByBaseSlug(pool, categoryId, baseSlug)
      : undefined;

    if (resolvedProductId !== undefined) {
      productId = resolvedProductId;
    } else {
      const productResult = await pool.query<{ id: number }>(
        `INSERT INTO product (category_id, name, base_slug, source_url, is_synthetic)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [categoryId, product.name, baseSlug, product.sourceUrl, product.isSynthetic]
      );
      const productRow = productResult.rows[0];
      if (!productRow) {
        throw new Error("failed to insert product");
      }
      productId = productRow.id;
    }

    const variantResult = await pool.query<{ id: number }>(
      `INSERT INTO product_variant (product_id, item_id, slug, price, compare_at_price)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [productId, product.itemId, variantSlug, product.price, product.compareAtPrice]
    );
    const variantRow = variantResult.rows[0];
    if (!variantRow) {
      throw new Error("failed to insert product variant");
    }
    variantId = variantRow.id;
  }

  await pool.query("DELETE FROM product_image WHERE variant_id = $1", [variantId]);
  for (const [position, url] of product.images.entries()) {
    await pool.query("INSERT INTO product_image (variant_id, url, position) VALUES ($1, $2, $3)", [
      variantId,
      url,
      position
    ]);
  }

  const attributeValueIds = await Promise.all([
    ensureAttributeValue(pool, "metal", product.metalType),
    ensureAttributeValue(pool, "diamondType", product.diamondType),
    ensureAttributeValue(pool, "carat", String(product.totalCarat)),
    ensureAttributeValue(pool, "stoneShape", product.stoneShape)
  ]);

  for (const attributeValueId of attributeValueIds) {
    await pool.query(
      "INSERT INTO variant_attribute_value (variant_id, attribute_value_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [variantId, attributeValueId]
    );
  }
}

export async function upsertWeddingRingsCatalog(
  pool: Pool,
  products: IngestedProduct[],
  categorySlug = "wedding-rings",
  categoryName = "Wedding Rings"
): Promise<void> {
  const categoryId = await ensureCategory(pool, categorySlug, categoryName);
  for (const product of products) {
    await upsertProduct(pool, categoryId, product);
  }
}
