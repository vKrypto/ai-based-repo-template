import type { Pool } from "pg";
import { attributeValueSubquery } from "../../shared/db/attributeSubquery.js";
import type { Category, CatalogFilters, FilterOptionDTO, HoverMediaDTO, ProductListItemDTO } from "./catalog.types.js";

interface ProductRow {
  product_id: number;
  item_id: string;
  name: string;
  slug: string;
  price: string;
  compare_at_price: string | null;
  avg_rating: string | null;
  review_count: number;
  image_url: string | null;
  hover_media_url: string | null;
  hover_media_type: string | null;
  metal: string | null;
  diamond_type: string | null;
  total_carat: string | null;
  stone_shape: string | null;
}

function attributeFilterCondition(filterKey: string, paramIndex: number): string {
  return `EXISTS (
    SELECT 1
    FROM variant_attribute_value vav
    JOIN attribute_value av ON av.id = vav.attribute_value_id
    JOIN attribute a ON a.id = av.attribute_id
    WHERE vav.variant_id = pv.id AND a.filter_key = '${filterKey}' AND av.value = $${paramIndex}
  )`;
}

function caratRangeCondition(hasMin: boolean, hasMax: boolean, minIndex: number, maxIndex: number): string {
  const bounds: string[] = [];
  if (hasMin) {
    bounds.push(`av.value::numeric >= $${minIndex}`);
  }
  if (hasMax) {
    bounds.push(`av.value::numeric <= $${maxIndex}`);
  }
  return `EXISTS (
    SELECT 1
    FROM variant_attribute_value vav
    JOIN attribute_value av ON av.id = vav.attribute_value_id
    JOIN attribute a ON a.id = av.attribute_id
    WHERE vav.variant_id = pv.id AND a.filter_key = 'carat' AND ${bounds.join(" AND ")}
  )`;
}

interface BuiltFilterClause {
  whereSql: string;
  params: unknown[];
}

function buildWhereClause(categoryId: number, filters: CatalogFilters): BuiltFilterClause {
  const conditions: string[] = ["p.category_id = $1"];
  const params: unknown[] = [categoryId];

  if (filters.metal) {
    params.push(filters.metal);
    conditions.push(attributeFilterCondition("metal", params.length));
  }
  if (filters.diamondType) {
    params.push(filters.diamondType);
    conditions.push(attributeFilterCondition("diamondType", params.length));
  }
  if (filters.stoneShape) {
    params.push(filters.stoneShape);
    conditions.push(attributeFilterCondition("stoneShape", params.length));
  }
  if (filters.caratMin !== undefined || filters.caratMax !== undefined) {
    let minIndex = -1;
    let maxIndex = -1;
    if (filters.caratMin !== undefined) {
      params.push(filters.caratMin);
      minIndex = params.length;
    }
    if (filters.caratMax !== undefined) {
      params.push(filters.caratMax);
      maxIndex = params.length;
    }
    conditions.push(
      caratRangeCondition(filters.caratMin !== undefined, filters.caratMax !== undefined, minIndex, maxIndex)
    );
  }
  if (filters.priceMin !== undefined) {
    params.push(filters.priceMin);
    conditions.push(`pv.price >= $${params.length}`);
  }
  if (filters.priceMax !== undefined) {
    params.push(filters.priceMax);
    conditions.push(`pv.price <= $${params.length}`);
  }
  if (filters.q) {
    params.push(`%${filters.q}%`);
    conditions.push(`p.name ILIKE $${params.length}`);
  }

  return { whereSql: conditions.join(" AND "), params };
}

function orderBySql(sort: CatalogFilters["sort"]): string {
  switch (sort) {
    case "price-asc":
      return "pv.price ASC";
    case "price-desc":
      return "pv.price DESC";
    case "best-sellers":
    default:
      return "p.review_count DESC, p.id ASC";
  }
}

function toHoverMediaDTO(row: ProductRow): HoverMediaDTO | null {
  if (!row.hover_media_url || !row.hover_media_type) {
    return null;
  }
  return { url: row.hover_media_url, mediaType: row.hover_media_type === "video" ? "video" : "image" };
}

function toProductListItemDTO(row: ProductRow): ProductListItemDTO {
  return {
    productId: row.product_id,
    itemId: row.item_id,
    name: row.name,
    slug: row.slug,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price === null ? null : Number(row.compare_at_price),
    imageUrl: row.image_url,
    hoverMedia: toHoverMediaDTO(row),
    metal: row.metal,
    diamondType: row.diamond_type,
    totalCarat: row.total_carat === null ? null : Number(row.total_carat),
    stoneShape: row.stone_shape,
    avgRating: row.avg_rating === null ? null : Number(row.avg_rating),
    reviewCount: row.review_count
  };
}

export async function findCategoryBySlug(pool: Pool, slug: string): Promise<Category | undefined> {
  const result = await pool.query<Category>("SELECT id, slug, name FROM category WHERE slug = $1", [slug]);
  return result.rows[0];
}

export async function findProductsForCategory(
  pool: Pool,
  categoryId: number,
  filters: CatalogFilters
): Promise<{ items: ProductListItemDTO[]; total: number }> {
  const { whereSql, params } = buildWhereClause(categoryId, filters);

  const countResult = await pool.query<{ count: string }>(
    `SELECT count(*)::text AS count
     FROM product p
     JOIN product_variant pv ON pv.product_id = p.id
     WHERE ${whereSql}`,
    params
  );
  const total = Number(countResult.rows[0]?.count ?? "0");

  const limitIndex = params.length + 1;
  const offsetIndex = params.length + 2;
  const offset = (filters.page - 1) * filters.pageSize;

  const itemsResult = await pool.query<ProductRow>(
    `SELECT
       p.id AS product_id,
       pv.item_id,
       p.name,
       pv.slug,
       pv.price::text AS price,
       pv.compare_at_price::text AS compare_at_price,
       p.avg_rating::text AS avg_rating,
       p.review_count,
       (SELECT url FROM product_image WHERE variant_id = pv.id ORDER BY position ASC LIMIT 1) AS image_url,
       (SELECT url FROM product_image WHERE variant_id = pv.id AND position = 1) AS hover_media_url,
       (SELECT media_type FROM product_image WHERE variant_id = pv.id AND position = 1) AS hover_media_type,
       ${attributeValueSubquery("display_label", "metal")} AS metal,
       ${attributeValueSubquery("display_label", "diamondType")} AS diamond_type,
       ${attributeValueSubquery("value", "carat")} AS total_carat,
       ${attributeValueSubquery("display_label", "stoneShape")} AS stone_shape
     FROM product p
     JOIN product_variant pv ON pv.product_id = p.id
     WHERE ${whereSql}
     ORDER BY ${orderBySql(filters.sort)}
     LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
    [...params, filters.pageSize, offset]
  );

  return { items: itemsResult.rows.map(toProductListItemDTO), total };
}

interface FilterValueRow {
  filter_key: string;
  attribute_name: string;
  value: string;
  display_label: string;
  count: string;
}

export async function findAvailableFilters(pool: Pool, categoryId: number): Promise<FilterOptionDTO[]> {
  const result = await pool.query<FilterValueRow>(
    `SELECT
       a.filter_key,
       a.name AS attribute_name,
       av.value,
       av.display_label,
       count(DISTINCT pv.id)::text AS count
     FROM attribute a
     JOIN attribute_value av ON av.attribute_id = a.id
     JOIN variant_attribute_value vav ON vav.attribute_value_id = av.id
     JOIN product_variant pv ON pv.id = vav.variant_id
     JOIN product p ON p.id = pv.product_id
     WHERE p.category_id = $1
     GROUP BY a.filter_key, a.name, av.value, av.display_label
     ORDER BY a.filter_key, (CASE WHEN a.filter_key = 'carat' THEN av.value::numeric END), av.display_label`,
    [categoryId]
  );

  const filtersByKey = new Map<string, FilterOptionDTO>();
  for (const row of result.rows) {
    let filter = filtersByKey.get(row.filter_key);
    if (!filter) {
      filter = { key: row.filter_key, label: row.attribute_name, values: [] };
      filtersByKey.set(row.filter_key, filter);
    }
    filter.values.push({ value: row.value, label: row.display_label, count: Number(row.count) });
  }

  return [...filtersByKey.values()];
}
