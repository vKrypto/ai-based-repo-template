import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CaratSelector } from "./CaratSelector.js";
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

describe("CaratSelector", () => {
  it("renders nothing when there is only one carat option", () => {
    const { container } = render(
      <CaratSelector options={[buildVariant()]} currentCarat={1} onSelect={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an option per distinct carat value", () => {
    const options = [
      buildVariant({ itemId: "1", totalCarat: 1 }),
      buildVariant({ itemId: "2", totalCarat: 2 })
    ];
    render(<CaratSelector options={options} currentCarat={1} onSelect={vi.fn()} />);

    expect(screen.getByRole("combobox")).toHaveValue("1");
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("calls onSelect with the chosen variant", () => {
    const onSelect = vi.fn();
    const options = [
      buildVariant({ itemId: "1", totalCarat: 1 }),
      buildVariant({ itemId: "2", totalCarat: 2 })
    ];
    render(<CaratSelector options={options} currentCarat={1} onSelect={onSelect} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
    expect(onSelect).toHaveBeenCalledWith(options[1]);
  });
});
