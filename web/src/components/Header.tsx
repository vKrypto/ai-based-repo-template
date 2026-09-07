import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { NAV_CATEGORIES } from "../lib/navCategories.js";
import { useCart } from "../contexts/CartContext.js";
import { useWishlist } from "../contexts/WishlistContext.js";
import styles from "./Header.module.css";

export function Header(): ReactElement {
  const { cart } = useCart();
  const { wishlist } = useWishlist();

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        Bare Brilliant
      </Link>
      <nav>
        <ul className={styles.nav}>
          {NAV_CATEGORIES.map((category) => (
            <li key={category.slug}>
              <Link to={`/${category.slug}`}>{category.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.actions}>
        <Link to="/wishlist" className={styles.actionLink} aria-label="Wishlist">
          Wishlist
          {wishlist.items.length > 0 && (
            <span className={styles.badge} data-testid="wishlist-count">
              {wishlist.items.length}
            </span>
          )}
        </Link>
        <Link to="/cart" className={styles.actionLink} aria-label="Cart">
          Cart
          {cart.itemCount > 0 && (
            <span className={styles.badge} data-testid="cart-count">
              {cart.itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
