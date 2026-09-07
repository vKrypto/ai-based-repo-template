import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DiamondTypeToggle } from "./DiamondTypeToggle.js";
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

describe("DiamondTypeToggle", () => {
  it("renders nothing when there is only one diamond type option", () => {
    const { container } = render(
      <DiamondTypeToggle options={[buildVariant()]} currentDiamondType="Natural Diamond" onSelect={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a pill per distinct diamond type and marks the current one pressed", () => {
    const options = [
      buildVariant({ itemId: "1", diamondType: "Natural Diamond" }),
      buildVariant({ itemId: "2", diamondType: "Lab-Grown Diamond" })
    ];
    render(<DiamondTypeToggle options={options} currentDiamondType="Natural Diamond" onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Natural" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Lab-Grown" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onSelect with the chosen variant", () => {
    const onSelect = vi.fn();
    const options = [
      buildVariant({ itemId: "1", diamondType: "Natural Diamond" }),
      buildVariant({ itemId: "2", diamondType: "Lab-Grown Diamond" })
    ];
    render(<DiamondTypeToggle options={options} currentDiamondType="Natural Diamond" onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Lab-Grown" }));
    expect(onSelect).toHaveBeenCalledWith(options[1]);
  });
});
