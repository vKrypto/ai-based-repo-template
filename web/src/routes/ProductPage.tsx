import { useEffect, useState, type ReactElement } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, fetchJson } from "../lib/apiClient.js";
import { buildProductPath, calculateDiscountPercent, formatPrice, titleCaseSlug } from "../lib/catalogQuery.js";
import { computeShipsByDate, extractItemId, formatShipsByDate, uniqueVariantsByAttribute } from "../lib/productQuery.js";
import type { ProductDetailDTO, VariantSummaryDTO } from "../lib/productTypes.js";
import { Accordion } from "../components/Accordion.js";
import { CaratSelector } from "../components/CaratSelector.js";
import { DiamondTypeToggle } from "../components/DiamondTypeToggle.js";
import { ImageGallery } from "../components/ImageGallery.js";
import { InfoTable } from "../components/InfoTable.js";
import { MetalSwatchSelector } from "../components/MetalSwatchSelector.js";
import { RingSizeSelector } from "../components/RingSizeSelector.js";
import { SimilarItems } from "../components/SimilarItems.js";
import { WishlistButton } from "../components/WishlistButton.js";
import { useCart } from "../contexts/CartContext.js";
import styles from "./ProductPage.module.css";

type LoadStatus = "loading" | "ready" | "not-found" | "error";

const SHIPS_BY_BUSINESS_DAYS = 4;
const ADD_TO_CART_FEEDBACK_MS = 1500;
const RING_CATEGORY_SLUGS = new Set(["wedding-rings", "engagement-rings", "rings"]);

function buildInfoRows(product: ProductDetailDTO): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [{ label: "Stock Number", value: product.itemId }];
  if (product.metal) rows.push({ label: "Metal", value: product.metal });
  if (product.totalCarat !== null) rows.push({ label: "Total Carat Weight", value: `${product.totalCarat} ct` });
  if (product.stoneShape) rows.push({ label: "Stone Shape", value: product.stoneShape });
  if (product.diamondType) rows.push({ label: "Diamond Type", value: product.diamondType });
  return rows;
}

export function ProductPage(): ReactElement {
  const { category, slugAndId } = useParams<{ category: string; slugAndId: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<ProductDetailDTO | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [addedToCart, setAddedToCart] = useState(false);

  const itemId = slugAndId ? extractItemId(slugAndId) : undefined;

  useEffect(() => {
    if (!itemId) {
      setStatus("not-found");
      return undefined;
    }

    let cancelled = false;
    setStatus("loading");

    fetchJson<ProductDetailDTO>(`/api/products/${itemId}`)
      .then((response) => {
        if (cancelled) {
          return;
        }
        setProduct(response);
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
  }, [itemId]);

  useEffect(() => {
    if (!addedToCart) {
      return undefined;
    }
    const timeoutId = setTimeout(() => setAddedToCart(false), ADD_TO_CART_FEEDBACK_MS);
    return () => clearTimeout(timeoutId);
  }, [addedToCart]);

  function navigateToVariant(variant: VariantSummaryDTO): void {
    if (!category) {
      return;
    }
    navigate(buildProductPath(category, variant.slug, variant.itemId));
  }

  function handleAddToCart(): void {
    if (!product) {
      return;
    }
    void addItem(product.itemId, 1);
    setAddedToCart(true);
  }

  if (!category) {
    return <p>Product not found.</p>;
  }

  if (status === "not-found") {
    return (
      <main className={styles.page}>
        <p>This product could not be found.</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className={styles.page}>
        <p>Something went wrong loading this product. Please try again.</p>
      </main>
    );
  }

  if (status === "loading" || !product) {
    return (
      <main className={styles.page}>
        <p>Loading…</p>
      </main>
    );
  }

  const categoryName = titleCaseSlug(category);
  const currentAsVariant: VariantSummaryDTO = {
    itemId: product.itemId,
    slug: product.slug,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    metal: product.metal,
    diamondType: product.diamondType,
    totalCarat: product.totalCarat,
    stoneShape: product.stoneShape
  };
  const allVariants = [currentAsVariant, ...product.siblingVariants];
  const metalOptions = uniqueVariantsByAttribute(allVariants, (variant) => variant.metal);
  const diamondTypeOptions = uniqueVariantsByAttribute(allVariants, (variant) => variant.diamondType);
  const caratOptions = uniqueVariantsByAttribute(allVariants, (variant) => variant.totalCarat);
  const shipsByLabel = formatShipsByDate(computeShipsByDate(SHIPS_BY_BUSINESS_DAYS));

  return (
    <main className={styles.page}>
      <nav aria-label="breadcrumb" className={styles.breadcrumb}>
        <Link to="/">Home</Link> / <Link to={`/${category}`}>{categoryName}</Link> / <span>{product.name}</span>
      </nav>

      <div className={styles.layout}>
        <div className={styles.mediaColumn}>
          <ImageGallery key={product.itemId} images={product.images} video={product.video} name={product.name} />
          <InfoTable rows={buildInfoRows(product)} />
        </div>

        <div className={styles.details}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{product.name}</h1>
            <WishlistButton itemId={product.itemId} />
          </div>

          {product.reviewCount > 0 && (
            <div className={styles.rating}>
              <span aria-hidden="true">★★★★★</span>
              <span>({product.reviewCount})</span>
            </div>
          )}

          <div className={styles.priceRow}>
            {product.compareAtPrice !== null && (
              <span className={styles.compareAtPrice}>{formatPrice(product.compareAtPrice)}</span>
            )}
            <span className={styles.price}>{formatPrice(product.price)}</span>
            {product.compareAtPrice !== null && (
              <span className={styles.discountBadge}>
                -{calculateDiscountPercent(product.price, product.compareAtPrice)}%
              </span>
            )}
          </div>

          <hr className={styles.divider} />

          <MetalSwatchSelector options={metalOptions} currentMetal={product.metal} onSelect={navigateToVariant} />
          <DiamondTypeToggle
            options={diamondTypeOptions}
            currentDiamondType={product.diamondType}
            onSelect={navigateToVariant}
          />
          <CaratSelector options={caratOptions} currentCarat={product.totalCarat} onSelect={navigateToVariant} />
          {RING_CATEGORY_SLUGS.has(category) && <RingSizeSelector />}

          <p className={styles.shipsBy}>
            Ships by: <strong>{shipsByLabel}</strong>
          </p>
          <p className={styles.shippingBadges}>Free Overnight Shipping · Hassle-Free Returns</p>

          <button type="button" className={styles.addToCartButton} onClick={handleAddToCart}>
            {addedToCart ? "Added ✓" : "Add to Cart"}
          </button>
          <Link to="/contact-us" className={styles.consultLink}>
            Consult an Expert
          </Link>

          <div className={styles.accordions}>
            <Accordion title="Your Order Includes" defaultOpen>
              <p>
                Free shipping, a complimentary appraisal on orders over $1,000, and free returns on every order.
              </p>
            </Accordion>
            <Accordion title="Product Details">
              <p>
                A {product.metal ?? "fine metal"} setting featuring{" "}
                {(product.diamondType ?? "diamonds").toLowerCase()}
                {product.totalCarat !== null ? ` totaling ${product.totalCarat} ct` : ""}, finished with hand-set
                craftsmanship.
              </p>
            </Accordion>
            <Accordion title="Secure Shopping">
              <p>Every order is protected end to end, from checkout through delivery.</p>
            </Accordion>
            <Accordion title="Lifetime Product Warranty">
              <p>We stand behind our products and warrant them against manufacturing defects for life.</p>
            </Accordion>
            <Accordion title="About Fine Jewelry">
              <p>Explore our collections to find a piece that fits any occasion, from everyday wear to milestone gifts.</p>
            </Accordion>
          </div>
        </div>
      </div>

      <SimilarItems categorySlug={category} excludeItemId={product.itemId} />
    </main>
  );
}
