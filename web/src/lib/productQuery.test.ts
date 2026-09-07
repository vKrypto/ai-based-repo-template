import { describe, it, expect } from "vitest";
import { computeShipsByDate, extractItemId, formatShipsByDate, uniqueVariantsByAttribute } from "./productQuery.js";
import type { VariantSummaryDTO } from "./productTypes.js";

describe("extractItemId", () => {
  it("extractItemId('low-dome-basket-ring-item-241257') -> '241257'", () => {
    expect(extractItemId("low-dome-basket-ring-item-241257")).toBe("241257");
  });

  it("returns undefined when there is no trailing -item-{id} segment", () => {
    expect(extractItemId("low-dome-basket-ring")).toBeUndefined();
  });

  it("only matches the trailing item id, not one embedded mid-string", () => {
    expect(extractItemId("item-241257-extra")).toBeUndefined();
  });

  it("extractItemId('classic-solitaire-ring-item-SYN-000256') -> 'SYN-000256'", () => {
    expect(extractItemId("classic-solitaire-ring-item-SYN-000256")).toBe("SYN-000256");
  });

  it("extractItemId('petite-hoop-earrings-item-DEMO-EARRINGS-000001') -> 'DEMO-EARRINGS-000001'", () => {
    expect(extractItemId("petite-hoop-earrings-item-DEMO-EARRINGS-000001")).toBe("DEMO-EARRINGS-000001");
  });
});

function buildVariant(overrides: Partial<VariantSummaryDTO> = {}): VariantSummaryDTO {
  return {
    itemId: "1",
    slug: "ring",
    price: 1000,
    compareAtPrice: null,
    metal: "14K White Gold",
    diamondType: "Natural Diamond",
    totalCarat: 1,
    stoneShape: "Round",
    ...overrides
  };
}

describe("computeShipsByDate", () => {
  it("computeShipsByDate(1, Thursday) -> the next business day (Friday)", () => {
    const from = new Date("2026-07-02T00:00:00");
    expect(computeShipsByDate(1, from).toDateString()).toBe("Fri Jul 03 2026");
  });

  it("skips the weekend when counting business days", () => {
    const from = new Date("2026-07-02T00:00:00");
    expect(computeShipsByDate(3, from).toDateString()).toBe("Tue Jul 07 2026");
  });
});

describe("formatShipsByDate", () => {
  it("formatShipsByDate(2026-07-07) -> 'Tuesday, July 7'", () => {
    expect(formatShipsByDate(new Date("2026-07-07T00:00:00"))).toBe("Tuesday, July 7");
  });
});

describe("uniqueVariantsByAttribute", () => {
  it("keeps the first variant seen for each distinct attribute value", () => {
    const variants = [
      buildVariant({ itemId: "1", metal: "14K White Gold" }),
      buildVariant({ itemId: "2", metal: "Platinum" }),
      buildVariant({ itemId: "3", metal: "14K White Gold" })
    ];

    const result = uniqueVariantsByAttribute(variants, (variant) => variant.metal);
    expect(result.map((variant) => variant.itemId)).toEqual(["1", "2"]);
  });

  it("excludes variants where the attribute is null", () => {
    const variants = [buildVariant({ itemId: "1", stoneShape: null })];
    expect(uniqueVariantsByAttribute(variants, (variant) => variant.stoneShape)).toEqual([]);
  });
});
