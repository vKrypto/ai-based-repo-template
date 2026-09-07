import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiError, fetchJson } from "../lib/apiClient.js";
import { catalogFiltersToSearchParams, formatPrice, parseCatalogFilters, titleCaseSlug } from "../lib/catalogQuery.js";
import type {
  CatalogFilterState,
  CatalogResponseDTO,
  CatalogSort,
  FilterOptionDTO,
  ProductListItemDTO
} from "../lib/catalogTypes.js";
import { FilterBar } from "../components/FilterBar.js";
import { ProductCard } from "../components/ProductCard.js";
import styles from "./CatalogPage.module.css";

const PAGE_SIZE = 24;

interface CatalogPageMeta {
  total: number;
  availableFilters: FilterOptionDTO[];
}

type LoadStatus = "loading" | "ready" | "not-found" | "error";

interface ActiveFilterChip {
  key: string;
  label: string;
  clearPatch: Partial<CatalogFilterState>;
}

function buildActiveFilterChips(filters: CatalogFilterState): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.metal) {
    chips.push({ key: "metal", label: `Metal: ${filters.metal}`, clearPatch: { metal: undefined } });
  }
  if (filters.diamondType) {
    chips.push({
      key: "diamondType",
      label: `Diamond Type: ${filters.diamondType}`,
      clearPatch: { diamondType: undefined }
    });
  }
  if (filters.stoneShape) {
    chips.push({
      key: "stoneShape",
      label: `Stone Shape: ${filters.stoneShape}`,
      clearPatch: { stoneShape: undefined }
    });
  }
  if (filters.caratMin !== undefined) {
    chips.push({
      key: "carat",
      label: `${filters.caratMin} ct`,
      clearPatch: { caratMin: undefined, caratMax: undefined }
    });
  }
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    const label =
      filters.priceMin !== undefined && filters.priceMax !== undefined
        ? `${formatPrice(filters.priceMin)} - ${formatPrice(filters.priceMax)}`
        : filters.priceMin !== undefined
          ? `${formatPrice(filters.priceMin)} & Up`
          : `Under ${formatPrice(filters.priceMax ?? 0)}`;
    chips.push({ key: "price", label, clearPatch: { priceMin: undefined, priceMax: undefined } });
  }

  return chips;
}

export function CatalogPage(): ReactElement {
  const { category } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<ProductListItemDTO[]>([]);
  const [meta, setMeta] = useState<CatalogPageMeta | null>(null);
  const [loadedPage, setLoadedPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filters = useMemo(() => parseCatalogFilters(searchParams), [searchParams]);
  const hasMore = meta !== null && items.length < meta.total;

  useEffect(() => {
    if (!category) {
      return undefined;
    }
    let cancelled = false;
    setStatus("loading");
    setItems([]);
    setMeta(null);

    const query = catalogFiltersToSearchParams(filters);
    query.set("pageSize", String(PAGE_SIZE));

    fetchJson<CatalogResponseDTO>(`/api/categories/${category}/products?${query.toString()}`)
      .then((response) => {
        if (cancelled) {
          return;
        }
        setItems(response.items);
        setMeta({ total: response.total, availableFilters: response.availableFilters });
        setLoadedPage(response.page);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setStatus(error instanceof ApiError && error.status === 404 ? "not-found" : "error");
      });

    return () => {
      cancelled = true;
    };
  }, [category, searchParams, filters]);

  const loadMoreItems = useCallback((): void => {
    if (!category || isLoadingMore || !hasMore) {
      return;
    }
    const nextPage = loadedPage + 1;
    setIsLoadingMore(true);

    const query = catalogFiltersToSearchParams({ ...filters, page: nextPage });
    query.set("pageSize", String(PAGE_SIZE));

    fetchJson<CatalogResponseDTO>(`/api/categories/${category}/products?${query.toString()}`)
      .then((response) => {
        setItems((previous) => [...previous, ...response.items]);
        setLoadedPage(response.page);
      })
      .catch(() => undefined)
      .finally(() => setIsLoadingMore(false));
  }, [category, isLoadingMore, hasMore, loadedPage, filters]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || status !== "ready") {
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        loadMoreItems();
      }
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, status, loadMoreItems]);

  function applyFilters(next: CatalogFilterState): void {
    setSearchParams(catalogFiltersToSearchParams(next));
  }

  function handleFilterChange(patch: Partial<CatalogFilterState>): void {
    applyFilters({ ...filters, ...patch, page: 1 });
  }

  function handleSortChange(sort: CatalogSort): void {
    applyFilters({ ...filters, sort, page: 1 });
  }

  function handleResetFilters(): void {
    applyFilters({ sort: "best-sellers", page: 1 });
  }

  if (!category) {
    return <p>Category not found.</p>;
  }

  if (status === "not-found") {
    return (
      <main className={styles.page}>
        <p>This category could not be found.</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className={styles.page}>
        <p>Something went wrong loading this catalog. Please try again.</p>
      </main>
    );
  }

  const categoryName = titleCaseSlug(category);
  const activeChips = buildActiveFilterChips(filters);

  return (
    <main className={styles.page}>
      <nav aria-label="breadcrumb" className={styles.breadcrumb}>
        <Link to="/">Home</Link> / <span>{categoryName}</span>
      </nav>

      <h1 className={styles.title}>Shop {categoryName}</h1>
      <p className={styles.description}>
        Explore our {categoryName.toLowerCase()} collection, hand-finished in natural and lab-grown diamonds across
        a range of precious metals.
      </p>

      {meta && (
        <FilterBar
          availableFilters={meta.availableFilters}
          filters={filters}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
        />
      )}

      {activeChips.length > 0 && (
        <div className={styles.activeFilters}>
          {activeChips.map((chip) => (
            <button key={chip.key} type="button" onClick={() => handleFilterChange(chip.clearPatch)}>
              {chip.label} ×
            </button>
          ))}
          <button type="button" className={styles.resetButton} onClick={handleResetFilters}>
            Reset Filters
          </button>
        </div>
      )}

      {status === "loading" && <p>Loading…</p>}

      {status === "ready" && meta && (
        <>
          <p className={styles.resultsCount}>
            {meta.total} {meta.total === 1 ? "Result" : "Results"}
          </p>

          {items.length === 0 ? (
            <p className={styles.emptyState}>No products match your filters. Try adjusting or resetting them.</p>
          ) : (
            <div className={styles.grid}>
              {items.map((item) => (
                <ProductCard key={item.itemId} item={item} categorySlug={category} />
              ))}
            </div>
          )}

          {hasMore && <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />}
          {isLoadingMore && <p className={styles.loadingMore}>Loading more…</p>}
        </>
      )}
    </main>
  );
}
