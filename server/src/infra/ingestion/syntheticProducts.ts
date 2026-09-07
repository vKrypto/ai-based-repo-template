import type { IngestedProduct } from "./types.js";

const METALS = ["14K White Gold", "14K Yellow Gold", "14K Rose Gold", "18K White Gold", "18K Yellow Gold", "Platinum"];
const DIAMOND_TYPES = ["Natural Diamond", "Lab-Grown Diamond"];
const CARATS = [0.5, 1, 1.5, 2, 3, 4, 5];
const SHAPES = ["Round", "Oval", "Emerald", "Princess", "Cushion"];
const STYLES = ["Classic Solitaire", "French Pave Eternity", "Three Stone", "Halo Wedding", "Curved Stacking"];

const PLACEHOLDER_IMAGE = "/placeholder-product.svg";
const NATURAL_DIAMOND_CARAT_RATE = 1400;
const LAB_GROWN_DIAMOND_CARAT_RATE = 620;
const PLATINUM_SURCHARGE = 300;
const EIGHTEEN_KARAT_SURCHARGE = 150;
const DISCOUNT_RATE = 0.3;
const DISCOUNTED_SEQUENCE_INTERVAL = 3;

function compareAtPriceFor(sequence: number, price: number): number | null {
  const isDiscounted = sequence % DISCOUNTED_SEQUENCE_INTERVAL === 0;
  return isDiscounted ? Math.round(price / (1 - DISCOUNT_RATE)) : null;
}

function toGroupKey(parts: string[]): string {
  return parts
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

function priceFor(carat: number, diamondType: string, metal: string): number {
  const caratRate = diamondType === "Natural Diamond" ? NATURAL_DIAMOND_CARAT_RATE : LAB_GROWN_DIAMOND_CARAT_RATE;
  const metalSurcharge = metal.includes("Platinum")
    ? PLATINUM_SURCHARGE
    : metal.includes("18K")
      ? EIGHTEEN_KARAT_SURCHARGE
      : 0;
  return Math.round(carat * caratRate + metalSurcharge);
}

export interface SyntheticProductOptions {
  itemNoun?: string;
  idPrefix?: string;
}

export function generateSyntheticProducts(
  count: number,
  { itemNoun = "Ring", idPrefix = "SYN" }: SyntheticProductOptions = {}
): IngestedProduct[] {
  const products: IngestedProduct[] = [];
  let sequence = 1;

  for (const style of STYLES) {
    for (const shape of SHAPES) {
      for (const metal of METALS) {
        for (const diamondType of DIAMOND_TYPES) {
          for (const carat of CARATS) {
            if (products.length >= count) {
              return products;
            }
            const itemId = `${idPrefix}-${String(sequence).padStart(6, "0")}`;
            const price = priceFor(carat, diamondType, metal);
            products.push({
              itemId,
              name: `${style} ${diamondType} ${itemNoun} (${carat} Ct. tw.)`,
              price,
              compareAtPrice: compareAtPriceFor(sequence, price),
              groupKey: toGroupKey([idPrefix, style, shape, diamondType, itemNoun, String(carat)]),
              metalType: metal,
              diamondType,
              totalCarat: carat,
              stoneShape: shape,
              sourceUrl: null,
              images: [PLACEHOLDER_IMAGE],
              isSynthetic: true
            });
            sequence += 1;
          }
        }
      }
    }
  }

  return products;
}
