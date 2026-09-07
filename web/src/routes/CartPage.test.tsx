import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CartPage } from "./CartPage.js";
import { CartProvider } from "../contexts/CartContext.js";
import type { CartDTO } from "../lib/cartTypes.js";

function buildCart(overrides: Partial<CartDTO> = {}): CartDTO {
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
        metal: "Platinum",
        quantity: 2,
        lineTotal: 2000
      }
    ],
    itemCount: 2,
    subtotal: 2000,
    ...overrides
  };
}

function mockFetchSequence(responses: Array<{ body: unknown; status?: number }>): void {
  const fakeFetch = vi.fn();
  for (const { body, status = 200 } of responses) {
    fakeFetch.mockResolvedValueOnce({ ok: status < 300, status, json: () => Promise.resolve(body) });
  }
  vi.stubGlobal("fetch", fakeFetch);
}

function renderCartPage(): void {
  render(
    <MemoryRouter>
      <CartProvider>
        <CartPage />
      </CartProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CartPage", () => {
  it("shows an empty state with a link back to shopping when the cart has no items", async () => {
    mockFetchSequence([{ body: { items: [], itemCount: 0, subtotal: 0 } }]);
    renderCartPage();

    expect(await screen.findByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it("renders cart items with quantity, line total and subtotal", async () => {
    mockFetchSequence([{ body: buildCart() }]);
    renderCartPage();

    expect(await screen.findByText("Low Dome Basket Ring")).toBeInTheDocument();
    expect(screen.getByText("Platinum")).toBeInTheDocument();
    expect(screen.getAllByText("$2,000").length).toBeGreaterThan(0);
  });

  it("updates the quantity via the API when changed", async () => {
    mockFetchSequence([{ body: buildCart() }, { body: buildCart({ items: [], itemCount: 0, subtotal: 0 }) }]);
    renderCartPage();
    await screen.findByText("Low Dome Basket Ring");

    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "3" } });

    await waitFor(() => {
      const lastCall = vi.mocked(fetch).mock.calls.at(-1)!;
      expect(String(lastCall[0])).toBe("/api/cart/items/241257");
      expect((lastCall[1] as RequestInit).method).toBe("PATCH");
    });
  });

  it("removes an item via the API when Remove is clicked", async () => {
    mockFetchSequence([{ body: buildCart() }, { body: { items: [], itemCount: 0, subtotal: 0 } }]);
    renderCartPage();
    await screen.findByText("Low Dome Basket Ring");

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument());
  });

  it("links to the checkout page", async () => {
    mockFetchSequence([{ body: buildCart() }]);
    renderCartPage();
    await screen.findByText("Low Dome Basket Ring");

    expect(screen.getByRole("link", { name: /proceed to checkout/i })).toHaveAttribute("href", "/checkout");
  });
});
