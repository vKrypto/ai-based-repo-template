import type { Pool } from "pg";
import { attributeValueSubquery } from "../../shared/db/attributeSubquery.js";
import type { CartDTO, CartItemDTO } from "./cart.types.js";

interface CartItemRow {
  item_id: string;
  product_id: number;
  category_slug: string;
  name: string;
  slug: string;
  price: string;
  compare_at_price: string | null;
  image_url: string | null;
  metal: string | null;
  quantity: number;
}

function toCartItemDTO(row: CartItemRow): CartItemDTO {
  const price = Number(row.price);
  return {
    itemId: row.item_id,
    productId: row.product_id,
    categorySlug: row.category_slug,
    name: row.name,
    slug: row.slug,
    price,
    compareAtPrice: row.compare_at_price === null ? null : Number(row.compare_at_price),
    imageUrl: row.image_url,
    metal: row.metal,
    quantity: row.quantity,
    lineTotal: price * row.quantity
  };
}

export async function findCart(pool: Pool, sessionId: number | undefined): Promise<CartDTO> {
  if (sessionId === undefined) {
    return { items: [], itemCount: 0, subtotal: 0 };
  }

  const result = await pool.query<CartItemRow>(
    `SELECT
       pv.item_id,
       p.id AS product_id,
       c.slug AS category_slug,
       p.name,
       pv.slug,
       pv.price::text AS price,
       pv.compare_at_price::text AS compare_at_price,
       (SELECT url FROM product_image WHERE variant_id = pv.id AND media_type = 'image' ORDER BY position ASC LIMIT 1) AS image_url,
       ${attributeValueSubquery("display_label", "metal")} AS metal,
       ci.quantity
     FROM cart_item ci
     JOIN product_variant pv ON pv.id = ci.variant_id
     JOIN product p ON p.id = pv.product_id
     JOIN category c ON c.id = p.category_id
     WHERE ci.session_id = $1
     ORDER BY ci.created_at ASC`,
    [sessionId]
  );

  const items = result.rows.map(toCartItemDTO);
  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0)
  };
}

export async function upsertCartItem(
  pool: Pool,
  sessionId: number,
  variantId: number,
  quantity: number
): Promise<void> {
  await pool.query(
    `INSERT INTO cart_item (session_id, variant_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (session_id, variant_id)
     DO UPDATE SET quantity = cart_item.quantity + EXCLUDED.quantity, updated_at = now()`,
    [sessionId, variantId, quantity]
  );
}

export async function setCartItemQuantity(
  pool: Pool,
  sessionId: number,
  variantId: number,
  quantity: number
): Promise<void> {
  await pool.query(
    "UPDATE cart_item SET quantity = $1, updated_at = now() WHERE session_id = $2 AND variant_id = $3",
    [quantity, sessionId, variantId]
  );
}

export async function removeCartItem(pool: Pool, sessionId: number, variantId: number): Promise<void> {
  await pool.query("DELETE FROM cart_item WHERE session_id = $1 AND variant_id = $2", [sessionId, variantId]);
}

export async function clearCart(pool: Pool, sessionId: number): Promise<void> {
  await pool.query("DELETE FROM cart_item WHERE session_id = $1", [sessionId]);
}
