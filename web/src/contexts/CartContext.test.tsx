import type { ReactElement } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { CartProvider, useCart } from "./CartContext.js";
import type { CartDTO } from "../lib/cartTypes.js";

function buildCart(overrides: Partial<CartDTO> = {}): CartDTO {
  return {
    items: [
      {
        itemId: "241257",
        productId: 1,
        categorySlug: "wedding-rings",
        name: "Test Ring",
        slug: "test-ring",
        price: 1000,
        compareAtPrice: null,
        imageUrl: null,
        metal: "Platinum",
        quantity: 1,
        lineTotal: 1000
      }
    ],
    itemCount: 1,
    subtotal: 1000,
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

function TestConsumer(): ReactElement {
  const { cart, isLoading, addItem, updateQuantity, removeItem } = useCart();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="count">{cart.itemCount}</span>
      <span data-testid="subtotal">{cart.subtotal}</span>
      <button onClick={() => void addItem("241257", 1)}>Add</button>
      <button onClick={() => void updateQuantity("241257", 5)}>Update</button>
      <button onClick={() => void removeItem("241257")}>Remove</button>
    </div>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CartContext", () => {
  it("loads the cart on mount", async () => {
    mockFetchSequence([{ body: buildCart() }]);

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
    expect(screen.getByTestId("subtotal")).toHaveTextContent("1000");
  });

  it("adds an item and updates state from the response", async () => {
    mockFetchSequence([{ body: buildCart({ items: [], itemCount: 0, subtotal: 0 }) }, { body: buildCart() }]);

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("0"));
    fireEvent.click(screen.getByText("Add"));

    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
  });

  it("removes an item and updates state from the response", async () => {
    mockFetchSequence([{ body: buildCart() }, { body: buildCart({ items: [], itemCount: 0, subtotal: 0 }) }]);

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
    fireEvent.click(screen.getByText("Remove"));

    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("0"));
  });

  it("falls back to an empty cart without an unhandled rejection when the initial load fails", async () => {
    mockFetchSequence([{ body: { message: "boom" }, status: 500 }]);

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });
});
