import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { WishlistPage } from "./WishlistPage.js";
import { CartProvider } from "../contexts/CartContext.js";
import { WishlistProvider } from "../contexts/WishlistContext.js";
import type { WishlistDTO } from "../lib/wishlistTypes.js";

function buildWishlist(overrides: Partial<WishlistDTO> = {}): WishlistDTO {
  return {
    items: [
      {
        itemId: "241257",
        productId: 1,
        categorySlug: "wedding-rings",
        name: "Low Dome Basket Ring",
        slug: "low-dome-basket-ring",
        price: 1000,
        compareAtPrice: null,
        imageUrl: null,
        metal: "Platinum"
      }
    ],
    ...overrides
  };
}

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: () => Promise.resolve(body) } as Response;
}

function mockFetchRouter(wishlistBody: unknown, cartBody: unknown = { items: [], itemCount: 0, subtotal: 0 }): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/wishlist")) {
        return Promise.resolve(jsonResponse(wishlistBody));
      }
      if (url.includes("/api/cart")) {
        return Promise.resolve(jsonResponse(cartBody));
      }
      return Promise.resolve(jsonResponse({}));
    })
  );
}

function renderWishlistPage(): void {
  render(
    <MemoryRouter>
      <CartProvider>
        <WishlistProvider>
          <WishlistPage />
        </WishlistProvider>
      </CartProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WishlistPage", () => {
  it("shows an empty state with a link back to shopping when there are no items", async () => {
    mockFetchRouter({ items: [] });
    renderWishlistPage();

    expect(await screen.findByText(/your wishlist is empty/i)).toBeInTheDocument();
  });

  it("renders wishlist items linking to their product detail page", async () => {
    mockFetchRouter(buildWishlist());
    renderWishlistPage();

    const links = await screen.findAllByRole("link", { name: "Low Dome Basket Ring" });
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/wedding-rings/low-dome-basket-ring-item-241257");
    }
    expect(screen.getByText("$1,000")).toBeInTheDocument();
  });

  it("removes the item from the wishlist when Remove is clicked", async () => {
    mockFetchRouter(buildWishlist(), { items: [], itemCount: 0, subtotal: 0 });
    renderWishlistPage();
    await screen.findByText("Low Dome Basket Ring");

    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ items: [] }));
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(screen.getByText(/your wishlist is empty/i)).toBeInTheDocument());
  });

  it("moves the item to the cart when Move to Cart is clicked", async () => {
    mockFetchRouter(buildWishlist());
    renderWishlistPage();
    await screen.findByText("Low Dome Basket Ring");

    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        items: [
          {
            itemId: "241257",
            productId: 1,
            categorySlug: "wedding-rings",
            name: "Low Dome Basket Ring",
            slug: "low-dome-basket-ring",
            price: 1000,
            compareAtPrice: null,
            imageUrl: null,
            metal: "Platinum",
            quantity: 1,
            lineTotal: 1000
          }
        ],
        itemCount: 1,
        subtotal: 1000
      })
    );
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ items: [] }));

    fireEvent.click(screen.getByRole("button", { name: "Move to Cart" }));

    await waitFor(() => {
      const calledUrls = vi.mocked(fetch).mock.calls.map((call) => String(call[0]));
      expect(calledUrls).toContain("/api/cart/items");
    });
  });
});
