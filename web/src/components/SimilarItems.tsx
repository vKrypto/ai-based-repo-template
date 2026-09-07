import { useEffect, useState, type ReactElement } from "react";
import { fetchJson } from "../lib/apiClient.js";
import type { CatalogResponseDTO, ProductListItemDTO } from "../lib/catalogTypes.js";
import { ProductCard } from "./ProductCard.js";
import styles from "./SimilarItems.module.css";

const SIMILAR_ITEMS_LIMIT = 4;
const FETCH_PAGE_SIZE = 5;

interface SimilarItemsProps {
  categorySlug: string;
  excludeItemId: string;
}

export function SimilarItems({ categorySlug, excludeItemId }: SimilarItemsProps): ReactElement | null {
  const [items, setItems] = useState<ProductListItemDTO[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetchJson<CatalogResponseDTO>(`/api/categories/${categorySlug}/products?pageSize=${FETCH_PAGE_SIZE}`)
      .then((response) => {
        if (cancelled) {
          return;
        }
        setItems(response.items.filter((item) => item.itemId !== excludeItemId).slice(0, SIMILAR_ITEMS_LIMIT));
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [categorySlug, excludeItemId]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Similar Items</h2>
      <div className={styles.grid}>
        {items.map((item) => (
          <ProductCard key={item.itemId} item={item} categorySlug={categorySlug} />
        ))}
      </div>
    </section>
  );
}
