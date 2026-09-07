import type { Pool } from "pg";
import { attributeValueSubquery } from "../../shared/db/attributeSubquery.js";
import type { WishlistDTO, WishlistItemDTO } from "./wishlist.types.js";

interface WishlistItemRow {
  item_id: string;
  product_id: number;
  category_slug: string;
  name: string;
  slug: string;
  price: string;
  compare_at_price: string | null;
  image_url: string | null;
  metal: string | null;
}

function toWishlistItemDTO(row: WishlistItemRow): WishlistItemDTO {
  return {
    itemId: row.item_id,
    productId: row.product_id,
    categorySlug: row.category_slug,
    name: row.name,
    slug: row.slug,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price === null ? null : Number(row.compare_at_price),
    imageUrl: row.image_url,
    metal: row.metal
  };
}

export async function findWishlist(pool: Pool, sessionId: number | undefined): Promise<WishlistDTO> {
  if (sessionId === undefined) {
    return { items: [] };
  }

  const result = await pool.query<WishlistItemRow>(
    `SELECT
       pv.item_id,
       p.id AS product_id,
       c.slug AS category_slug,
       p.name,
       pv.slug,
       pv.price::text AS price,
       pv.compare_at_price::text AS compare_at_price,
       (SELECT url FROM product_image WHERE variant_id = pv.id AND media_type = 'image' ORDER BY position ASC LIMIT 1) AS image_url,
       ${attributeValueSubquery("display_label", "metal")} AS metal
     FROM wishlist_item wi
     JOIN product_variant pv ON pv.id = wi.variant_id
     JOIN product p ON p.id = pv.product_id
     JOIN category c ON c.id = p.category_id
     WHERE wi.session_id = $1
     ORDER BY wi.created_at ASC`,
    [sessionId]
  );

  return { items: result.rows.map(toWishlistItemDTO) };
}

export async function addWishlistItem(pool: Pool, sessionId: number, variantId: number): Promise<void> {
  await pool.query(
    "INSERT INTO wishlist_item (session_id, variant_id) VALUES ($1, $2) ON CONFLICT (session_id, variant_id) DO NOTHING",
    [sessionId, variantId]
  );
}

export async function removeWishlistItem(pool: Pool, sessionId: number, variantId: number): Promise<void> {
  await pool.query("DELETE FROM wishlist_item WHERE session_id = $1 AND variant_id = $2", [sessionId, variantId]);
}
