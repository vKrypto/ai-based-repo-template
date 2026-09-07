import type { Pool } from "pg";
import { findPageBySlug } from "./pages.repository.js";
import type { StaticPage } from "./pages.types.js";
import { NotFoundError } from "../../shared/errors/index.js";

export async function getPageBySlug(pool: Pool, slug: string): Promise<StaticPage> {
  const page = await findPageBySlug(pool, slug);
  if (!page) {
    throw new NotFoundError(`page not found: ${slug}`);
  }
  return page;
}
