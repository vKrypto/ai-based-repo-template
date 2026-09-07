import type { Pool } from "pg";
import type { CartLineForOrder, OrderDTO, OrderItemDTO, ShippingAddressInput } from "./orders.types.js";

interface CartLineRow {
  variant_id: number;
  item_id: string;
  name: string;
  price: string;
  image_url: string | null;
  quantity: number;
}

export async function findCartItemsForSession(pool: Pool, sessionId: number): Promise<CartLineForOrder[]> {
  const result = await pool.query<CartLineRow>(
    `SELECT
       pv.id AS variant_id,
       pv.item_id,
       p.name,
       pv.price::text AS price,
       (SELECT url FROM product_image WHERE variant_id = pv.id AND media_type = 'image' ORDER BY position ASC LIMIT 1) AS image_url,
       ci.quantity
     FROM cart_item ci
     JOIN product_variant pv ON pv.id = ci.variant_id
     JOIN product p ON p.id = pv.product_id
     WHERE ci.session_id = $1
     ORDER BY ci.created_at ASC`,
    [sessionId]
  );

  return result.rows.map((row) => ({
    variantId: row.variant_id,
    itemId: row.item_id,
    name: row.name,
    price: Number(row.price),
    imageUrl: row.image_url,
    quantity: row.quantity
  }));
}

export async function createOrder(
  pool: Pool,
  sessionId: number,
  address: ShippingAddressInput,
  lines: CartLineForOrder[]
): Promise<number> {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  const orderResult = await pool.query<{ id: number }>(
    `INSERT INTO customer_order
       (session_id, subtotal, shipping_name, shipping_line1, shipping_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country, shipping_phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      sessionId,
      subtotal,
      address.name,
      address.line1,
      address.line2 ?? null,
      address.city,
      address.state,
      address.postalCode,
      address.country,
      address.phone ?? null
    ]
  );
  const orderId = orderResult.rows[0]!.id;

  for (const line of lines) {
    await pool.query(
      `INSERT INTO customer_order_item (order_id, variant_id, name, price, quantity, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderId, line.variantId, line.name, line.price, line.quantity, line.imageUrl]
    );
  }

  return orderId;
}

export async function clearCartItems(pool: Pool, sessionId: number): Promise<void> {
  await pool.query("DELETE FROM cart_item WHERE session_id = $1", [sessionId]);
}

interface OrderRow {
  id: number;
  status: string;
  subtotal: string;
  shipping_name: string;
  shipping_line1: string;
  shipping_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  shipping_phone: string | null;
  created_at: Date;
}

interface OrderItemRow {
  item_id: string | null;
  name: string;
  price: string;
  quantity: number;
  image_url: string | null;
}

export async function findOrderById(pool: Pool, orderId: number): Promise<OrderDTO | undefined> {
  const orderResult = await pool.query<OrderRow>("SELECT * FROM customer_order WHERE id = $1", [orderId]);
  const orderRow = orderResult.rows[0];
  if (!orderRow) {
    return undefined;
  }

  const itemsResult = await pool.query<OrderItemRow>(
    `SELECT pv.item_id, coi.name, coi.price::text AS price, coi.quantity, coi.image_url
     FROM customer_order_item coi
     LEFT JOIN product_variant pv ON pv.id = coi.variant_id
     WHERE coi.order_id = $1`,
    [orderId]
  );

  const items: OrderItemDTO[] = itemsResult.rows.map((row) => ({
    itemId: row.item_id,
    name: row.name,
    price: Number(row.price),
    quantity: row.quantity,
    imageUrl: row.image_url,
    lineTotal: Number(row.price) * row.quantity
  }));

  return {
    orderId: orderRow.id,
    status: orderRow.status,
    subtotal: Number(orderRow.subtotal),
    shippingAddress: {
      name: orderRow.shipping_name,
      line1: orderRow.shipping_line1,
      line2: orderRow.shipping_line2,
      city: orderRow.shipping_city,
      state: orderRow.shipping_state,
      postalCode: orderRow.shipping_postal_code,
      country: orderRow.shipping_country,
      phone: orderRow.shipping_phone
    },
    items,
    createdAt: orderRow.created_at.toISOString()
  };
}
