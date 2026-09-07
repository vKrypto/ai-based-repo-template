import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Header } from "./Header.js";
import { CartProvider } from "../contexts/CartContext.js";
import { WishlistProvider } from "../contexts/WishlistContext.js";

function mockFetch(cartItemCount: number, wishlistItemCount: number): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/cart")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ items: [], itemCount: cartItemCount, subtotal: 0 })
        });
      }
      if (url.includes("/api/wishlist")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ items: Array.from({ length: wishlistItemCount }, () => ({})) })
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
    })
  );
}

function renderHeader(cartItemCount = 0, wishlistItemCount = 0): void {
  mockFetch(cartItemCount, wishlistItemCount);
  render(
    <MemoryRouter>
      <CartProvider>
        <WishlistProvider>
          <Header />
        </WishlistProvider>
      </CartProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Header", () => {
  it("renders the primary category navigation", () => {
    renderHeader();

    expect(screen.getByRole("link", { name: "Engagement Rings" })).toHaveAttribute(
      "href",
      "/engagement-rings"
    );
    expect(screen.getByRole("link", { name: "Rings" })).toHaveAttribute("href", "/rings");
    expect(screen.getByRole("link", { name: "Earrings" })).toHaveAttribute("href", "/earrings");
    expect(screen.getByRole("link", { name: "Bracelets" })).toHaveAttribute("href", "/bracelets");
    expect(screen.getByRole("link", { name: "Necklaces" })).toHaveAttribute("href", "/necklaces");
    expect(screen.getByRole("link", { name: "Diamonds" })).toHaveAttribute("href", "/diamonds");
    expect(screen.getByRole("link", { name: "Gemstones" })).toHaveAttribute("href", "/gemstones");
    expect(screen.getByRole("link", { name: "Gifts" })).toHaveAttribute("href", "/gifts");
  });

  it("links the logo back to the homepage", () => {
    renderHeader();

    expect(screen.getByRole("link", { name: "Bare Brilliant" })).toHaveAttribute("href", "/");
  });

  it("links to the wishlist and shows the item count once loaded", async () => {
    renderHeader(0, 3);

    const link = screen.getByRole("link", { name: /wishlist/i });
    expect(link).toHaveAttribute("href", "/wishlist");
    await waitFor(() => expect(link).toHaveTextContent("3"));
  });

  it("links to the cart and shows the item count once loaded", async () => {
    renderHeader(2, 0);

    const link = screen.getByRole("link", { name: /cart/i });
    expect(link).toHaveAttribute("href", "/cart");
    await waitFor(() => expect(link).toHaveTextContent("2"));
  });

  it("hides the count badge when empty", async () => {
    renderHeader(0, 0);

    await waitFor(() => expect(screen.getByRole("link", { name: /cart/i })).toBeInTheDocument());
    expect(screen.queryByTestId("cart-count")).not.toBeInTheDocument();
    expect(screen.queryByTestId("wishlist-count")).not.toBeInTheDocument();
  });
});
