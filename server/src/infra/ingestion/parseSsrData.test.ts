import { describe, it, expect } from "vitest";
import { parseSsrDataHtml } from "./parseSsrData.js";
import type { RawBlueNileProduct } from "./parseSsrData.js";

function buildFixtureHtml(products: RawBlueNileProduct[]): string {
  const ssrData = {
    ssrPageData: {
      items: [products.map((product) => ({ product }))]
    }
  };
  return `<html><body><script type="application/json" data-app-selector="ssrData">${JSON.stringify(
    ssrData
  )}</script></body></html>`;
}

const SAMPLE_PRODUCT: RawBlueNileProduct = {
  itemID: 241257,
  title: "Low Dome Basket Lab-Grown Diamond  Eternity Ring In 14K White Gold",
  price: 2620,
  salePrice: null,
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

describe("parseSsrDataHtml", () => {
  it("extracts every product embedded in the ssrData script tag", () => {
    const html = buildFixtureHtml([SAMPLE_PRODUCT]);

    const products = parseSsrDataHtml(html);

    expect(products).toHaveLength(1);
    expect(products[0]?.itemID).toBe(241257);
    expect(products[0]?.jewel.metal.type).toBe("14K White Gold");
  });

  it("returns an empty array when the page has no ssrData script tag", () => {
    expect(parseSsrDataHtml("<html><body>no data here</body></html>")).toEqual([]);
  });
});
