import { useState, type ReactElement, type SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { buildProductPath, calculateDiscountPercent, formatPrice } from "../lib/catalogQuery.js";
import type { ProductListItemDTO } from "../lib/catalogTypes.js";
import { WishlistButton } from "./WishlistButton.js";
import styles from "./ProductCard.module.css";

const PLACEHOLDER_IMAGE = "/placeholder-product.svg";

interface ProductCardProps {
  item: ProductListItemDTO;
  categorySlug: string;
}

export function ProductCard({ item, categorySlug }: ProductCardProps): ReactElement {
  const [imageSrc, setImageSrc] = useState(item.imageUrl ?? PLACEHOLDER_IMAGE);
  const [isHovering, setIsHovering] = useState(false);
  const detailPath = buildProductPath(categorySlug, item.slug, item.itemId);

  function handleImageError(_event: SyntheticEvent<HTMLImageElement>): void {
    setImageSrc(PLACEHOLDER_IMAGE);
  }

  const showHoverImage = isHovering && item.hoverMedia?.mediaType === "image";
  const showHoverVideo = isHovering && item.hoverMedia?.mediaType === "video";
  const displaySrc = showHoverImage ? item.hoverMedia!.url : imageSrc;

  return (
    <article className={styles.card}>
      <Link
        to={detailPath}
        className={styles.imageLink}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className={styles.wishlistOverlay}>
          <WishlistButton itemId={item.itemId} />
        </div>
        <img
          src={displaySrc}
          alt={item.name}
          className={styles.image}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
        />
        {showHoverVideo && (
          <video
            className={styles.hoverVideo}
            poster={imageSrc}
            preload="none"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={item.hoverMedia!.url} type="video/mp4" />
          </video>
        )}
      </Link>
      <h3 className={styles.name}>
        <Link to={detailPath}>{item.name}</Link>
      </h3>
      <div className={styles.priceRow}>
        {item.compareAtPrice !== null && (
          <span className={styles.compareAtPrice}>{formatPrice(item.compareAtPrice)}</span>
        )}
        <span className={styles.price}>{formatPrice(item.price)}</span>
        {item.compareAtPrice !== null && (
          <span className={styles.discountBadge}>
            -{calculateDiscountPercent(item.price, item.compareAtPrice)}%
          </span>
        )}
      </div>
      <ul className={styles.meta}>
        {item.metal && <li>{item.metal}</li>}
        {item.diamondType && <li>{item.diamondType}</li>}
      </ul>
      {item.reviewCount > 0 && (
        <div className={styles.rating} data-testid="product-rating">
          <span aria-hidden="true">★★★★★</span>
          <span>({item.reviewCount})</span>
        </div>
      )}
    </article>
  );
}
