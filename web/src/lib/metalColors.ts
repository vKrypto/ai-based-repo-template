const DEFAULT_METAL_COLOR = "#b8b8bd";

const METAL_COLOR_RULES: Array<{ pattern: RegExp; color: string }> = [
  { pattern: /rose gold/i, color: "#e5b8ac" },
  { pattern: /yellow gold/i, color: "#e6c88c" },
  { pattern: /white gold/i, color: "#d9d9dd" },
  { pattern: /platinum/i, color: "#8e8e93" },
  { pattern: /titanium/i, color: "#3a3a3c" },
  { pattern: /tungsten/i, color: "#7d7d80" },
  { pattern: /cobalt/i, color: "#5b6f8c" }
];

// getMetalColor("14K White Gold") -> "#d9d9dd"
export function getMetalColor(metal: string): string {
  return METAL_COLOR_RULES.find((rule) => rule.pattern.test(metal))?.color ?? DEFAULT_METAL_COLOR;
}
