import type { Request, Response } from "express";
import { dbPool } from "../../shared/db/pool.js";
import { getCatalogForCategory } from "./catalog.service.js";
import type { CatalogFilters, CatalogSort } from "./catalog.types.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 24;
const SORT_OPTIONS: readonly CatalogSort[] = ["best-sellers", "price-asc", "price-desc"];

function parseStringParam(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function parseNumberParam(value: unknown): number | undefined {
  const raw = parseStringParam(value);
  if (raw === undefined) {
    return undefined;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSort(value: unknown): CatalogSort {
  return SORT_OPTIONS.includes(value as CatalogSort) ? (value as CatalogSort) : "best-sellers";
}

function parseCatalogFilters(query: Request["query"]): CatalogFilters {
  return {
    metal: parseStringParam(query["metal"]),
    diamondType: parseStringParam(query["diamondType"]),
    stoneShape: parseStringParam(query["stoneShape"]),
    caratMin: parseNumberParam(query["caratMin"]),
    caratMax: parseNumberParam(query["caratMax"]),
    priceMin: parseNumberParam(query["priceMin"]),
    priceMax: parseNumberParam(query["priceMax"]),
    q: parseStringParam(query["q"]),
    sort: parseSort(query["sort"]),
    page: parseNumberParam(query["page"]) ?? DEFAULT_PAGE,
    pageSize: parseNumberParam(query["pageSize"]) ?? DEFAULT_PAGE_SIZE
  };
}

export async function listCategoryProducts(req: Request, res: Response): Promise<void> {
  const slug = req.params["slug"] ?? "";
  const filters = parseCatalogFilters(req.query);

  const result = await getCatalogForCategory(dbPool, slug, filters);
  res.status(200).json(result);
}
