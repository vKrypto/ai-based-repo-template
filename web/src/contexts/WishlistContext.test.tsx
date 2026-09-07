import type { ReactElement } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { WishlistProvider, useWishlist } from "./WishlistContext.js";
import type { WishlistDTO } from "../lib/wishlistTypes.js";

function buildWishlist(overrides: Partial<WishlistDTO> = {}): WishlistDTO {
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
        metal: "Platinum"
      }
    ],
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
  const { wishlist, isLoading, isInWishlist, toggleItem } = useWishlist();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="count">{wishlist.items.length}</span>
      <span data-testid="has-241257">{String(isInWishlist("241257"))}</span>
      <button onClick={() => void toggleItem("241257")}>Toggle</button>
    </div>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WishlistContext", () => {
  it("loads the wishlist on mount", async () => {
    mockFetchSequence([{ body: buildWishlist() }]);

    render(
      <WishlistProvider>
        <TestConsumer />
      </WishlistProvider>
    );

    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
    expect(screen.getByTestId("has-241257")).toHaveTextContent("true");
  });

  it("adds the item when toggled while absent", async () => {
    mockFetchSequence([{ body: buildWishlist({ items: [] }) }, { body: buildWishlist() }]);

    render(
      <WishlistProvider>
        <TestConsumer />
      </WishlistProvider>
    );

    await waitFor(() => expect(screen.getByTestId("has-241257")).toHaveTextContent("false"));
    fireEvent.click(screen.getByText("Toggle"));

    await waitFor(() => expect(screen.getByTestId("has-241257")).toHaveTextContent("true"));
  });

  it("removes the item when toggled while present", async () => {
    mockFetchSequence([{ body: buildWishlist() }, { body: buildWishlist({ items: [] }) }]);

    render(
      <WishlistProvider>
        <TestConsumer />
      </WishlistProvider>
    );

    await waitFor(() => expect(screen.getByTestId("has-241257")).toHaveTextContent("true"));
    fireEvent.click(screen.getByText("Toggle"));

    await waitFor(() => expect(screen.getByTestId("has-241257")).toHaveTextContent("false"));
  });

  it("falls back to an empty wishlist without an unhandled rejection when the initial load fails", async () => {
    mockFetchSequence([{ body: { message: "boom" }, status: 500 }]);

    render(
      <WishlistProvider>
        <TestConsumer />
      </WishlistProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });
});
