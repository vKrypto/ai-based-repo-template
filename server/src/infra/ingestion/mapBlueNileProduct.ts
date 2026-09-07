import type { RawBlueNileProduct } from "./parseSsrData.js";
import type { IngestedProduct } from "./types.js";

const IMAGE_CDN_BASE = "https://ion.bluenile.com/";
const SOURCE_SITE_BASE = "https://www.bluenile.com/";

export function mapBlueNileProduct(raw: RawBlueNileProduct): IngestedProduct {
  const primaryStone = raw.jewel.stones?.[0];
  const galleryImages = raw.jewel.allMedia[0]?.orbitvu?.ratio100?.image?.gallery ?? [];
  const imagePaths = galleryImages.length > 0 ? galleryImages : [raw.media.thumb];

  return {
    itemId: String(raw.itemID),
    name: raw.title.replace(/\s+/g, " ").trim(),
    price: raw.salePrice ?? raw.price,
    compareAtPrice: raw.salePrice !== null ? raw.price : null,
    groupKey: null,
    metalType: raw.jewel.metal.type,
    diamondType: primaryStone?.stoneTypeName ?? "Natural Diamond",
    totalCarat: primaryStone?.totalCarat ?? 0,
    stoneShape: primaryStone?.shape ?? "Round",
    sourceUrl: `${SOURCE_SITE_BASE}${raw.url}`,
    images: imagePaths.map((path) => `${IMAGE_CDN_BASE}${path}`),
    isSynthetic: false
  };
}
