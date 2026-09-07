import type { MouseEvent, ReactElement } from "react";
import { useWishlist } from "../contexts/WishlistContext.js";
import styles from "./WishlistButton.module.css";

interface WishlistButtonProps {
  itemId: string;
}

export function WishlistButton({ itemId }: WishlistButtonProps): ReactElement {
  const { isInWishlist, toggleItem } = useWishlist();
  const isSaved = isInWishlist(itemId);

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    event.stopPropagation();
    void toggleItem(itemId);
  }

  return (
    <button
      type="button"
      title="Add to Wishlist"
      aria-label="Add to Wishlist"
      aria-pressed={isSaved}
      className={isSaved ? styles.buttonActive : styles.button}
      onClick={handleClick}
    >
      <svg viewBox="0 0 19 18" fill={isSaved ? "currentColor" : "none"} aria-hidden="true">
        <path
          stroke="currentColor"
          strokeLinejoin="round"
          d="M6.418 3.503a4.23 4.23 0 0 0-3.05 1.147A4.37 4.37 0 0 0 2 7.647c.001.75.151 1.49.44 2.18a5.6 5.6 0 0 0 1.243 1.831 43.7 43.7 0 0 0 6.082 4.775.45.45 0 0 0 .47 0 43.7 43.7 0 0 0 6.082-4.775 5.6 5.6 0 0 0 1.243-1.832c.289-.689.439-1.43.44-2.179a4.37 4.37 0 0 0-1.369-2.997 4.23 4.23 0 0 0-3.05-1.147 4.66 4.66 0 0 0-2.96 1.07q-.349.319-.621.706a4.4 4.4 0 0 0-.62-.707 4.66 4.66 0 0 0-2.962-1.07Z"
        />
      </svg>
    </button>
  );
}
