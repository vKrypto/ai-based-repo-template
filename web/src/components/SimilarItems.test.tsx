import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SimilarItems } from "./SimilarItems.js";
import { WishlistProvider } from "../contexts/WishlistContext.js";
import type { CatalogResponseDTO } from "../lib/catalogTypes.js";

function buildResponse(overrides: Partial<CatalogResponseDTO> = {}): CatalogResponseDTO {
  return {
    items: [
      {
        productId: 1,
        itemId: "241257",
        name: "Current Ring",
        slug: "current-ring",
        price: 1000,
        compareAtPrice: null,
        imageUrl: null,
        hoverMedia: null,
        metal: "Platinum",
        diamondType: "Natural Diamond",
        totalCarat: 1,
        stoneShape: "Round",
        avgRating: null,
        reviewCount: 0
      },
      {
        productId: 2,
        itemId: "241258",
        name: "Other Ring",
        slug: "other-ring",
        price: 900,
        compareAtPrice: null,
        imageUrl: null,
        hoverMedia: null,
        metal: "Platinum",
        diamondType: "Natural Diamond",
        totalCarat: 1,
        stoneShape: "Round",
        avgRating: null,
        reviewCount: 0
      }
    ],
    total: 2,
    page: 1,
    pageSize: 5,
    availableFilters: [],
    ...overrides
  };
}

function mockFetchOnce(body: unknown): void {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(body) }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SimilarItems", () => {
  it("renders similar items excluding the current product", async () => {
    mockFetchOnce(buildResponse());

    render(
      <MemoryRouter>
        <WishlistProvider>
          <SimilarItems categorySlug="wedding-rings" excludeItemId="241257" />
        </WishlistProvider>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Similar Items" })).toBeInTheDocument();
    expect(screen.getByText("Other Ring")).toBeInTheDocument();
    expect(screen.queryByText("Current Ring")).not.toBeInTheDocument();
  });

  it("renders nothing when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) }));

    const { container } = render(
      <MemoryRouter>
        <WishlistProvider>
          <SimilarItems categorySlug="wedding-rings" excludeItemId="241257" />
        </WishlistProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
