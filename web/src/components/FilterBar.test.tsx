import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterBar } from "./FilterBar.js";
import type { CatalogFilterState, FilterOptionDTO } from "../lib/catalogTypes.js";

const AVAILABLE_FILTERS: FilterOptionDTO[] = [
  {
    key: "metal",
    label: "Metal Type",
    values: [
      { value: "Platinum", label: "Platinum", count: 169 },
      { value: "14K White Gold", label: "14K White Gold", count: 180 }
    ]
  },
  {
    key: "diamondType",
    label: "Diamond Type",
    values: [
      { value: "Natural Diamond", label: "Natural Diamond", count: 510 },
      { value: "Lab-Grown Diamond", label: "Lab-Grown Diamond", count: 490 }
    ]
  },
  {
    key: "stoneShape",
    label: "Stone Shape",
    values: [{ value: "Round", label: "Round", count: 300 }]
  },
  {
    key: "carat",
    label: "Total Carat Weight",
    values: [
      { value: "1", label: "1", count: 140 },
      { value: "2", label: "2", count: 134 }
    ]
  }
];

function baseFilters(overrides: Partial<CatalogFilterState> = {}): CatalogFilterState {
  return { sort: "best-sellers", page: 1, ...overrides };
}

describe("FilterBar", () => {
  it("renders a select for each attribute filter plus price", () => {
    render(
      <FilterBar
        availableFilters={AVAILABLE_FILTERS}
        filters={baseFilters()}
        onFilterChange={vi.fn()}
        onSortChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Metal")).toBeInTheDocument();
    expect(screen.getByLabelText("Diamond Type")).toBeInTheDocument();
    expect(screen.getByLabelText("Stone Shape")).toBeInTheDocument();
    expect(screen.getByLabelText("Total Carat")).toBeInTheDocument();
    expect(screen.getByLabelText("Price")).toBeInTheDocument();
  });

  it("calls onFilterChange with the selected metal", () => {
    const onFilterChange = vi.fn();
    render(
      <FilterBar
        availableFilters={AVAILABLE_FILTERS}
        filters={baseFilters()}
        onFilterChange={onFilterChange}
        onSortChange={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Metal"), { target: { value: "Platinum" } });
    expect(onFilterChange).toHaveBeenCalledWith({ metal: "Platinum" });
  });

  it("clears the metal filter when 'All Metal' is reselected", () => {
    const onFilterChange = vi.fn();
    render(
      <FilterBar
        availableFilters={AVAILABLE_FILTERS}
        filters={baseFilters({ metal: "Platinum" })}
        onFilterChange={onFilterChange}
        onSortChange={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Metal"), { target: { value: "" } });
    expect(onFilterChange).toHaveBeenCalledWith({ metal: undefined });
  });

  it("sets both caratMin and caratMax when a carat value is selected", () => {
    const onFilterChange = vi.fn();
    render(
      <FilterBar
        availableFilters={AVAILABLE_FILTERS}
        filters={baseFilters()}
        onFilterChange={onFilterChange}
        onSortChange={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Total Carat"), { target: { value: "2" } });
    expect(onFilterChange).toHaveBeenCalledWith({ caratMin: 2, caratMax: 2 });
  });

  it("sets a price range when a price bucket is selected", () => {
    const onFilterChange = vi.fn();
    render(
      <FilterBar
        availableFilters={AVAILABLE_FILTERS}
        filters={baseFilters()}
        onFilterChange={onFilterChange}
        onSortChange={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Price"), { target: { value: "5000-" } });
    expect(onFilterChange).toHaveBeenCalledWith({ priceMin: 5000, priceMax: undefined });
  });

  it("calls onSortChange when the sort select changes", () => {
    const onSortChange = vi.fn();
    render(
      <FilterBar
        availableFilters={AVAILABLE_FILTERS}
        filters={baseFilters()}
        onFilterChange={vi.fn()}
        onSortChange={onSortChange}
      />
    );

    fireEvent.change(screen.getByLabelText("Sort By"), { target: { value: "price-asc" } });
    expect(onSortChange).toHaveBeenCalledWith("price-asc");
  });
});
