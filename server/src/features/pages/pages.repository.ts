import type { Pool } from "pg";
import type { StaticPage } from "./pages.types.js";

interface StaticPageRow {
  slug: string;
  title: string;
  content_html: string;
  updated_at: Date;
}

export async function findPageBySlug(pool: Pool, slug: string): Promise<StaticPage | undefined> {
  const result = await pool.query<StaticPageRow>(
    "SELECT slug, title, content_html, updated_at FROM static_page WHERE slug = $1",
    [slug]
  );
  const row = result.rows[0];
  if (!row) {
    return undefined;
  }

  return {
    slug: row.slug,
    title: row.title,
    contentHtml: row.content_html,
    updatedAt: row.updated_at.toISOString()
  };
}
