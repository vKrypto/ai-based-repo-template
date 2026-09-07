import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { WishlistButton } from "./WishlistButton.js";
import { WishlistProvider } from "../contexts/WishlistContext.js";
import type { WishlistDTO } from "../lib/wishlistTypes.js";

function mockFetchSequence(responses: Array<{ body: unknown; status?: number }>): void {
  const fakeFetch = vi.fn();
  for (const { body, status = 200 } of responses) {
    fakeFetch.mockResolvedValueOnce({ ok: status < 300, status, json: () => Promise.resolve(body) });
  }
  vi.stubGlobal("fetch", fakeFetch);
}

const EMPTY: WishlistDTO = { items: [] };
const WITH_241257: WishlistDTO = {
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
  ]
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WishlistButton", () => {
  it("starts unpressed when the item is not in the wishlist", async () => {
    mockFetchSequence([{ body: EMPTY }]);

    render(
      <WishlistProvider>
        <WishlistButton itemId="241257" />
      </WishlistProvider>
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add to Wishlist" })).toHaveAttribute("aria-pressed", "false")
    );
  });

  it("starts pressed when the item is already in the wishlist", async () => {
    mockFetchSequence([{ body: WITH_241257 }]);

    render(
      <WishlistProvider>
        <WishlistButton itemId="241257" />
      </WishlistProvider>
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add to Wishlist" })).toHaveAttribute("aria-pressed", "true")
    );
  });

  it("toggles to pressed on click, calling the wishlist API", async () => {
    mockFetchSequence([{ body: EMPTY }, { body: WITH_241257 }]);

    render(
      <WishlistProvider>
        <WishlistButton itemId="241257" />
      </WishlistProvider>
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add to Wishlist" })).toHaveAttribute("aria-pressed", "false")
    );
    fireEvent.click(screen.getByRole("button", { name: "Add to Wishlist" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add to Wishlist" })).toHaveAttribute("aria-pressed", "true")
    );
  });
});
