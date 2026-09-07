import { describe, it, expect } from "vitest";
import { mapBlueNileProduct } from "./mapBlueNileProduct.js";
import type { RawBlueNileProduct } from "./parseSsrData.js";

const RAW_PRODUCT: RawBlueNileProduct = {
  itemID: 241257,
  title: "Low Dome Basket  Lab-Grown Diamond Eternity Ring In 14K White Gold",
  price: 3200,
  salePrice: 2620,
  url: "wedding-rings/low-dome-basket-lab-grown-diamond-eternity-ring-in-14k-white-gold-3-ct-tw-f-g-vs2-si1-item-241257",
  media: { thumb: "sets/Jewelry/606140/thumb.jpg" },
  jewel: {
    metal: { type: "14K White Gold" },
    stones: [
      { stoneTypeName: "Lab-Grown Diamond", totalCarat: 3, color: "F-G", clarity: "VS2-SI1", shape: "Round" }
    ],
    allMedia: [{ orbitvu: { ratio100: { image: { gallery: ["sets/Jewelry/606140/main.jpg"] } } } }]
  }
};

describe("mapBlueNileProduct", () => {
  it("maps a raw product into the normalized ingestion shape", () => {
    const mapped = mapBlueNileProduct(RAW_PRODUCT);

    expect(mapped).toEqual({
      itemId: "241257",
      name: "Low Dome Basket Lab-Grown Diamond Eternity Ring In 14K White Gold",
      price: 2620,
      compareAtPrice: 3200,
      groupKey: null,
      metalType: "14K White Gold",
      diamondType: "Lab-Grown Diamond",
      totalCarat: 3,
      stoneShape: "Round",
      sourceUrl:
        "https://www.bluenile.com/wedding-rings/low-dome-basket-lab-grown-diamond-eternity-ring-in-14k-white-gold-3-ct-tw-f-g-vs2-si1-item-241257",
      images: ["https://ion.bluenile.com/sets/Jewelry/606140/main.jpg"],
      isSynthetic: false
    });
  });

  it("falls back to the thumb image when gallery media is missing", () => {
    const withoutGallery: RawBlueNileProduct = { ...RAW_PRODUCT, jewel: { ...RAW_PRODUCT.jewel, allMedia: [] } };

    const mapped = mapBlueNileProduct(withoutGallery);

    expect(mapped.images).toEqual(["https://ion.bluenile.com/sets/Jewelry/606140/thumb.jpg"]);
  });

  it("falls back to the full price when there is no sale price", () => {
    const withoutSale: RawBlueNileProduct = { ...RAW_PRODUCT, salePrice: null };

    expect(mapBlueNileProduct(withoutSale).price).toBe(3200);
  });

  it("has no compareAtPrice when there is no sale price", () => {
    const withoutSale: RawBlueNileProduct = { ...RAW_PRODUCT, salePrice: null };

    expect(mapBlueNileProduct(withoutSale).compareAtPrice).toBeNull();
  });

  it("defaults sensibly for plain metal bands that have no stones at all", () => {
    const noStones: RawBlueNileProduct = { ...RAW_PRODUCT, jewel: { ...RAW_PRODUCT.jewel, stones: null } };

    const mapped = mapBlueNileProduct(noStones);

    expect(mapped.diamondType).toBe("Natural Diamond");
    expect(mapped.totalCarat).toBe(0);
    expect(mapped.stoneShape).toBe("Round");
  });
});
