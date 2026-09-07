import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MetalSwatchSelector } from "./MetalSwatchSelector.js";
import type { VariantSummaryDTO } from "../lib/productTypes.js";

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

describe("MetalSwatchSelector", () => {
  it("renders nothing when there is only one metal option", () => {
    const { container } = render(
      <MetalSwatchSelector options={[buildVariant()]} currentMetal="14K White Gold" onSelect={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a swatch button per distinct metal and labels the current one", () => {
    const options = [buildVariant({ itemId: "1", metal: "14K White Gold" }), buildVariant({ itemId: "2", metal: "Platinum" })];
    render(<MetalSwatchSelector options={options} currentMetal="14K White Gold" onSelect={vi.fn()} />);

    expect(screen.getByText("14K White Gold", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "14K White Gold" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Platinum" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onSelect with the chosen variant when a swatch is clicked", () => {
    const onSelect = vi.fn();
    const options = [buildVariant({ itemId: "1", metal: "14K White Gold" }), buildVariant({ itemId: "2", metal: "Platinum" })];
    render(<MetalSwatchSelector options={options} currentMetal="14K White Gold" onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Platinum" }));
    expect(onSelect).toHaveBeenCalledWith(options[1]);
  });
});
