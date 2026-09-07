import { describe, it, expect } from "vitest";
import { getMetalColor } from "./metalColors.js";

describe("getMetalColor", () => {
  it("getMetalColor('14K White Gold') -> a light silver hex color", () => {
    expect(getMetalColor("14K White Gold")).toBe("#d9d9dd");
  });

  it("getMetalColor('14K Yellow Gold') -> a yellow-gold hex color", () => {
    expect(getMetalColor("14K Yellow Gold")).toBe("#e6c88c");
  });

  it("getMetalColor('14K Rose Gold') -> a rose hex color", () => {
    expect(getMetalColor("14K Rose Gold")).toBe("#e5b8ac");
  });

  it("getMetalColor('Platinum') -> a grey hex color", () => {
    expect(getMetalColor("Platinum")).toBe("#8e8e93");
  });

  it("falls back to a neutral default for an unrecognized metal", () => {
    expect(getMetalColor("Mythril")).toBe("#b8b8bd");
  });
});
