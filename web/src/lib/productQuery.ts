import type { VariantSummaryDTO } from "./productTypes.js";

const ITEM_ID_PATTERN = /-item-([A-Za-z0-9-]+)$/;

// extractItemId("low-dome-basket-ring-item-241257") -> "241257"
export function extractItemId(slugAndId: string): string | undefined {
  return slugAndId.match(ITEM_ID_PATTERN)?.[1];
}

const WEEKEND_DAYS = new Set([0, 6]);

// computeShipsByDate(4) -> Date, N business days from now (skips weekends)
export function computeShipsByDate(businessDays: number, from: Date = new Date()): Date {
  const result = new Date(from);
  let added = 0;
  while (added < businessDays) {
    result.setDate(result.getDate() + 1);
    if (!WEEKEND_DAYS.has(result.getDay())) {
      added += 1;
    }
  }
  return result;
}

// formatShipsByDate(new Date("2026-07-07")) -> "Tuesday, July 7"
export function formatShipsByDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(date);
}

// uniqueVariantsByAttribute(variants, v => v.metal) -> first variant seen per distinct metal
export function uniqueVariantsByAttribute<Value>(
  variants: VariantSummaryDTO[],
  getAttribute: (variant: VariantSummaryDTO) => Value | null
): VariantSummaryDTO[] {
  const seen = new Set<Value>();
  const result: VariantSummaryDTO[] = [];
  for (const variant of variants) {
    const value = getAttribute(variant);
    if (value !== null && !seen.has(value)) {
      seen.add(value);
      result.push(variant);
    }
  }
  return result;
}
