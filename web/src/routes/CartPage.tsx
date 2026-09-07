import type { ChangeEvent, ReactElement } from "react";
import { Link } from "react-router-dom";
import { buildProductPath, formatPrice } from "../lib/catalogQuery.js";
import { useCart } from "../contexts/CartContext.js";
import styles from "./CartPage.module.css";

const PLACEHOLDER_IMAGE = "/placeholder-product.svg";
const QUANTITY_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);

export function CartPage(): ReactElement {
  const { cart, isLoading, updateQuantity, removeItem } = useCart();

  if (isLoading) {
    return (
      <main className={styles.page}>
        <p>Loading…</p>
      </main>
    );
  }

  if (cart.items.length === 0) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Your Cart</h1>
        <p className={styles.emptyState}>Your cart is empty.</p>
        <Link to="/wedding-rings" className={styles.continueLink}>
          Continue Shopping
        </Link>
      </main>
    );
  }

  function handleQuantityChange(itemId: string, event: ChangeEvent<HTMLSelectElement>): void {
    void updateQuantity(itemId, Number(event.target.value));
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Your Cart</h1>

      <div className={styles.layout}>
        <ul className={styles.items}>
          {cart.items.map((item) => {
            const detailPath = buildProductPath(item.categorySlug, item.slug, item.itemId);
            return (
            <li key={item.itemId} className={styles.item}>
              <Link to={detailPath}>
                <img src={item.imageUrl ?? PLACEHOLDER_IMAGE} alt={item.name} className={styles.itemImage} />
              </Link>
              <div className={styles.itemDetails}>
                <p className={styles.itemName}>
                  <Link to={detailPath}>{item.name}</Link>
                </p>
                {item.metal && <p className={styles.itemMeta}>{item.metal}</p>}
                <p className={styles.itemPrice}>{formatPrice(item.price)}</p>
                <label className={styles.quantityField}>
                  Quantity
                  <select value={item.quantity} onChange={(event) => handleQuantityChange(item.itemId, event)}>
                    {QUANTITY_OPTIONS.map((quantity) => (
                      <option key={quantity} value={quantity}>
                        {quantity}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className={styles.removeButton} onClick={() => void removeItem(item.itemId)}>
                  Remove
                </button>
              </div>
              <p className={styles.lineTotal}>{formatPrice(item.lineTotal)}</p>
            </li>
            );
          })}
        </ul>

        <aside className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
          <Link to="/checkout" className={styles.checkoutButton}>
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </main>
  );
}
