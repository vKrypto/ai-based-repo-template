import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { buildProductPath, formatPrice } from "../lib/catalogQuery.js";
import { useCart } from "../contexts/CartContext.js";
import { useWishlist } from "../contexts/WishlistContext.js";
import styles from "./WishlistPage.module.css";

const PLACEHOLDER_IMAGE = "/placeholder-product.svg";

export function WishlistPage(): ReactElement {
  const { wishlist, isLoading, toggleItem } = useWishlist();
  const { addItem } = useCart();

  if (isLoading) {
    return (
      <main className={styles.page}>
        <p>Loading…</p>
      </main>
    );
  }

  if (wishlist.items.length === 0) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Your Wishlist</h1>
        <p className={styles.emptyState}>Your wishlist is empty.</p>
        <Link to="/wedding-rings" className={styles.continueLink}>
          Continue Shopping
        </Link>
      </main>
    );
  }

  function handleMoveToCart(itemId: string): void {
    void addItem(itemId, 1);
    void toggleItem(itemId);
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Your Wishlist</h1>

      <div className={styles.grid}>
        {wishlist.items.map((item) => {
          const detailPath = buildProductPath(item.categorySlug, item.slug, item.itemId);
          return (
            <article key={item.itemId} className={styles.card}>
              <Link to={detailPath} className={styles.imageLink}>
                <img src={item.imageUrl ?? PLACEHOLDER_IMAGE} alt={item.name} className={styles.image} />
              </Link>
              <h3 className={styles.name}>
                <Link to={detailPath}>{item.name}</Link>
              </h3>
              {item.metal && <p className={styles.meta}>{item.metal}</p>}
              <p className={styles.price}>{formatPrice(item.price)}</p>
              <div className={styles.actions}>
                <button type="button" className={styles.moveButton} onClick={() => handleMoveToCart(item.itemId)}>
                  Move to Cart
                </button>
                <button type="button" className={styles.removeButton} onClick={() => void toggleItem(item.itemId)}>
                  Remove
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
