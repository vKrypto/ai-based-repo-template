import type { Pool } from "pg";

export async function findVariantIdByItemId(pool: Pool, itemId: string): Promise<number | undefined> {
  const result = await pool.query<{ id: number }>("SELECT id FROM product_variant WHERE item_id = $1", [itemId]);
  return result.rows[0]?.id;
}
