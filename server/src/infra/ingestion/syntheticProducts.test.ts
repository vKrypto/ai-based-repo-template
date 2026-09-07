import { describe, it, expect } from "vitest";
import { generateSyntheticProducts } from "./syntheticProducts.js";

describe("generateSyntheticProducts", () => {
  it("generates exactly the requested count", () => {
    const products = generateSyntheticProducts(37);
    expect(products).toHaveLength(37);
  });

  it("gives every product a unique item id and marks it synthetic", () => {
    const products = generateSyntheticProducts(50);
    const itemIds = new Set(products.map((product) => product.itemId));

    expect(itemIds.size).toBe(50);
    expect(products.every((product) => product.isSynthetic)).toBe(true);
    expect(products.every((product) => product.price > 0)).toBe(true);
  });

  it("is deterministic across runs", () => {
    expect(generateSyntheticProducts(10)).toEqual(generateSyntheticProducts(10));
  });

  it("returns an empty array when count is zero", () => {
    expect(generateSyntheticProducts(0)).toEqual([]);
  });

  it("uses 'Ring' as the default product noun", () => {
    const [product] = generateSyntheticProducts(1);
    expect(product?.name).toContain("Ring");
  });

  it("substitutes a custom item noun into the product name", () => {
    const [product] = generateSyntheticProducts(1, { itemNoun: "Necklace" });
    expect(product?.name).toContain("Necklace");
    expect(product?.name).not.toContain("Ring");
  });

  it("prefixes item ids with a custom idPrefix so ids stay unique across categories", () => {
    const products = generateSyntheticProducts(3, { idPrefix: "DEMO-EARRINGS" });
    expect(products.every((product) => product.itemId.startsWith("DEMO-EARRINGS-"))).toBe(true);
  });

  it("gives some products a compareAtPrice higher than price, to demo the discount UI", () => {
    const products = generateSyntheticProducts(50);
    const discounted = products.filter((product) => product.compareAtPrice !== null);

    expect(discounted.length).toBeGreaterThan(0);
    expect(discounted.every((product) => product.compareAtPrice! > product.price)).toBe(true);
  });

  it("leaves compareAtPrice null for the rest, so not every card shows a discount", () => {
    const products = generateSyntheticProducts(50);
    expect(products.some((product) => product.compareAtPrice === null)).toBe(true);
  });

  it("does not bake the metal into the product name, since it now varies per sibling variant", () => {
    const [product] = generateSyntheticProducts(1);
    expect(product?.name).not.toMatch(/Gold|Platinum/);
  });

  it("gives products that only differ by metal the same groupKey, so they become sibling variants", () => {
    const products = generateSyntheticProducts(100);
    const metalsByGroupKey = new Map<string, Set<string>>();
    for (const product of products) {
      expect(product.groupKey).not.toBeNull();
      const metals = metalsByGroupKey.get(product.groupKey!) ?? new Set<string>();
      metals.add(product.metalType);
      metalsByGroupKey.set(product.groupKey!, metals);
    }

    const groupsWithMultipleMetals = [...metalsByGroupKey.values()].filter((metals) => metals.size > 1);
    expect(groupsWithMultipleMetals.length).toBeGreaterThan(0);
  });
});
