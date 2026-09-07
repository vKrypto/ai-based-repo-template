import type { ReactElement } from "react";
import type { CatalogFilterState, CatalogSort, FilterOptionDTO } from "../lib/catalogTypes.js";
import { formatPrice } from "../lib/catalogQuery.js";
import styles from "./FilterBar.module.css";

interface PriceBucket {
  label: string;
  min?: number;
  max?: number;
}

const PRICE_BUCKETS: PriceBucket[] = [
  { label: `Under ${formatPrice(1000)}`, max: 999 },
  { label: `${formatPrice(1000)} - ${formatPrice(2500)}`, min: 1000, max: 2500 },
  { label: `${formatPrice(2500)} - ${formatPrice(5000)}`, min: 2500, max: 5000 },
  { label: `${formatPrice(5000)} & Up`, min: 5000 }
];

const SORT_LABELS: Record<CatalogSort, string> = {
  "best-sellers": "Best Sellers",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low"
};

interface FilterBarProps {
  availableFilters: FilterOptionDTO[];
  filters: CatalogFilterState;
  onFilterChange: (patch: Partial<CatalogFilterState>) => void;
  onSortChange: (sort: CatalogSort) => void;
}

function findFilter(availableFilters: FilterOptionDTO[], key: string): FilterOptionDTO | undefined {
  return availableFilters.find((filter) => filter.key === key);
}

export function FilterBar({ availableFilters, filters, onFilterChange, onSortChange }: FilterBarProps): ReactElement {
  const metalFilter = findFilter(availableFilters, "metal");
  const diamondTypeFilter = findFilter(availableFilters, "diamondType");
  const stoneShapeFilter = findFilter(availableFilters, "stoneShape");
  const caratFilter = findFilter(availableFilters, "carat");

  function bucketKey(min: number | undefined, max: number | undefined): string {
    return `${min ?? ""}-${max ?? ""}`;
  }

  const currentPriceBucketKey =
    filters.priceMin !== undefined || filters.priceMax !== undefined
      ? bucketKey(filters.priceMin, filters.priceMax)
      : "";

  return (
    <div className={styles.bar}>
      {metalFilter && (
        <label className={styles.field}>
          <span>Metal</span>
          <select
            value={filters.metal ?? ""}
            onChange={(event) => onFilterChange({ metal: event.target.value || undefined })}
          >
            <option value="">All Metal</option>
            {metalFilter.values.map((value) => (
              <option key={value.value} value={value.value}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {stoneShapeFilter && (
        <label className={styles.field}>
          <span>Stone Shape</span>
          <select
            value={filters.stoneShape ?? ""}
            onChange={(event) => onFilterChange({ stoneShape: event.target.value || undefined })}
          >
            <option value="">All Stone Shapes</option>
            {stoneShapeFilter.values.map((value) => (
              <option key={value.value} value={value.value}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {caratFilter && (
        <label className={styles.field}>
          <span>Total Carat</span>
          <select
            value={filters.caratMin !== undefined ? String(filters.caratMin) : ""}
            onChange={(event) => {
              const raw = event.target.value;
              const parsed = raw === "" ? undefined : Number(raw);
              onFilterChange({ caratMin: parsed, caratMax: parsed });
            }}
          >
            <option value="">Any Carat</option>
            {caratFilter.values.map((value) => (
              <option key={value.value} value={value.value}>
                {value.label} ct
              </option>
            ))}
          </select>
        </label>
      )}

      {diamondTypeFilter && (
        <label className={styles.field}>
          <span>Diamond Type</span>
          <select
            value={filters.diamondType ?? ""}
            onChange={(event) => onFilterChange({ diamondType: event.target.value || undefined })}
          >
            <option value="">All Diamond Types</option>
            {diamondTypeFilter.values.map((value) => (
              <option key={value.value} value={value.value}>
                {value.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className={styles.field}>
        <span>Price</span>
        <select
          value={currentPriceBucketKey}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === "") {
              onFilterChange({ priceMin: undefined, priceMax: undefined });
              return;
            }
            const bucket = PRICE_BUCKETS.find((candidate) => bucketKey(candidate.min, candidate.max) === raw)!;
            onFilterChange({ priceMin: bucket.min, priceMax: bucket.max });
          }}
        >
          <option value="">Any Price</option>
          {PRICE_BUCKETS.map((bucket) => (
            <option key={bucket.label} value={bucketKey(bucket.min, bucket.max)}>
              {bucket.label}
            </option>
          ))}
        </select>
      </label>

      <label className={`${styles.field} ${styles.sortField}`}>
        <span>Sort By</span>
        <select value={filters.sort} onChange={(event) => onSortChange(event.target.value as CatalogSort)}>
          {(Object.keys(SORT_LABELS) as CatalogSort[]).map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
