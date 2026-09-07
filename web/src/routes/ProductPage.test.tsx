import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProductPage } from "./ProductPage.js";
import { CartProvider } from "../contexts/CartContext.js";
import { WishlistProvider } from "../contexts/WishlistContext.js";
import type { ProductDetailDTO } from "../lib/productTypes.js";

function buildProduct(overrides: Partial<ProductDetailDTO> = {}): ProductDetailDTO {
  return {
    productId: 35,
    itemId: "241257",
    name: "Low Dome Basket Lab-Grown Diamond Eternity Ring",
    slug: "low-dome-basket-lab-grown-diamond-eternity-ring",
    price: 2620,
    compareAtPrice: null,
    images: ["https://ion.bluenile.com/example.jpg"],
    video: null,
    metal: "14K White Gold",
    diamondType: "Lab-Grown Diamond",
    totalCarat: 3,
    stoneShape: "Round",
    avgRating: null,
    reviewCount: 0,
    siblingVariants: [],
    ...overrides
  };
}

const EMPTY_CART = { items: [], itemCount: 0, subtotal: 0 };
const EMPTY_WISHLIST = { items: [] };
const WISHLIST_WITH_241257 = {
  items: [
    {
      itemId: "241257",
      productId: 35,
      name: "Low Dome Basket Lab-Grown Diamond Eternity Ring",
      slug: "low-dome-basket-lab-grown-diamond-eternity-ring",
      price: 2620,
      compareAtPrice: null,
      imageUrl: null,
      metal: "14K White Gold"
    }
  ]
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body)
  } as Response;
}

function mockFetchOnce(productBody: unknown, productStatus = 200): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/products/")) {
        return Promise.resolve(jsonResponse(productBody, productStatus));
      }
      if (url.includes("/api/cart")) {
        return Promise.resolve(jsonResponse(EMPTY_CART));
      }
      if (url.includes("/api/wishlist/items")) {
        const method = init?.method ?? "GET";
        return Promise.resolve(jsonResponse(method === "DELETE" ? EMPTY_WISHLIST : WISHLIST_WITH_241257));
      }
      if (url.includes("/api/wishlist")) {
        return Promise.resolve(jsonResponse(EMPTY_WISHLIST));
      }
      return Promise.resolve(jsonResponse({}));
    })
  );
}

function renderProductPage(initialEntry: string): void {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CartProvider>
        <WishlistProvider>
          <Routes>
            <Route path="/:category/:slugAndId" element={<ProductPage />} />
          </Routes>
        </WishlistProvider>
      </CartProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ProductPage", () => {
  it("renders the breadcrumb, title and price once data loads", async () => {
    mockFetchOnce(buildProduct());
    renderProductPage("/wedding-rings/low-dome-basket-lab-grown-diamond-eternity-ring-item-241257");

    expect(
      await screen.findByRole("heading", { name: "Low Dome Basket Lab-Grown Diamond Eternity Ring" })
    ).toBeInTheDocument();
    expect(screen.getByText("$2,620")).toBeInTheDocument();
  });

  it("renders a paused, looping, controls-free video tile when the product has one", async () => {
    mockFetchOnce(buildProduct({ video: "https://example.com/clip.mp4" }));
    renderProductPage("/wedding-rings/low-dome-basket-lab-grown-diamond-eternity-ring-item-241257");

    await screen.findByRole("heading", { name: "Low Dome Basket Lab-Grown Diamond Eternity Ring" });

    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("loop");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).not.toHaveAttribute("controls");
    expect(video?.querySelector("source")).toHaveAttribute("src", "https://example.com/clip.mp4");
  });

  it("renders no video tile when the product has none", async () => {
    mockFetchOnce(buildProduct({ video: null }));
    renderProductPage("/wedding-rings/low-dome-basket-lab-grown-diamond-eternity-ring-item-241257");

    await screen.findByRole("heading", { name: "Low Dome Basket Lab-Grown Diamond Eternity Ring" });
    expect(document.querySelector("video")).toBeNull();
  });

  it("renders the original price struck through and a discount badge when compareAtPrice is set", async () => {
    mockFetchOnce(buildProduct({ price: 2620, compareAtPrice: 3200 }));
    renderProductPage("/wedding-rings/low-dome-basket-lab-grown-diamond-eternity-ring-item-241257");

    await screen.findByRole("heading", { name: "Low Dome Basket Lab-Grown Diamond Eternity Ring" });
    expect(screen.getByText("$3,200")).toBeInTheDocument();
    expect(screen.getByText("-18%")).toBeInTheDocument();
  });

  it("shows a not-found message when the URL has no trailing item id", async () => {
    mockFetchOnce(buildProduct());
    renderProductPage("/wedding-rings/not-a-valid-slug");

    expect(await screen.findByText(/this product could not be found/i)).toBeInTheDocument();
  });

  it("shows a not-found message when the API responds 404", async () => {
    mockFetchOnce({ message: "product not found" }, 404);
    renderProductPage("/wedding-rings/some-ring-item-999999");

    expect(await screen.findByText(/this product could not be found/i)).toBeInTheDocument();
  });

  it("hides the metal/diamond/carat selectors when there are no sibling variants", async () => {
    mockFetchOnce(buildProduct({ siblingVariants: [] }));
    renderProductPage("/wedding-rings/low-dome-basket-lab-grown-diamond-eternity-ring-item-241257");

    await screen.findByRole("heading", { name: "Low Dome Basket Lab-Grown Diamond Eternity Ring" });
    expect(screen.queryByLabelText("Total Carat Weight")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "14K White Gold" })).not.toBeInTheDocument();
  });

  it("shows a ring size selector for a ring category", async () => {
    mockFetchOnce(buildProduct());
    renderProductPage("/wedding-rings/low-dome-basket-lab-grown-diamond-eternity-ring-item-241257");

    await screen.findByRole("heading", { name: "Low Dome Basket Lab-Grown Diamond Eternity Ring" });
    expect(screen.getByLabelText("Ring Size:")).toBeInTheDocument();
  });

  it("hides the ring size selector for a non-ring category", async () => {
    mockFetchOnce(buildProduct());
    renderProductPage("/earrings/low-dome-basket-lab-grown-diamond-eternity-ring-item-241257");

    await screen.findByRole("heading", { name: "Low Dome Basket Lab-Grown Diamond Eternity Ring" });
    expect(screen.queryByLabelText("Ring Size:")).not.toBeInTheDocument();
  });

  it("refetches the sibling variant's data when a metal swatch is selected", async () => {
    mockFetchOnce(
      buildProduct({
        siblingVariants: [
          {
            itemId: "241258",
            slug: "low-dome-basket-lab-grown-diamond-eternity-ring",
            price: 3200,
            compareAtPrice: null,
            metal: "Platinum",
            diamondType: "Lab-Grown Diamond",
            totalCarat: 3,
            stoneShape: "Round"
          }
        ]
      })
    );
    renderProductPage("/wedding-rings/low-dome-basket-lab-grown-diamond-eternity-ring-item-241257");
    await screen.findByRole("heading", { name: "Low Dome Basket Lab-Grown Diamond Eternity Ring" });

    fireEvent.click(screen.getByRole("button", { name: "Platinum" }));

    await waitFor(() => {
      const lastCallUrl = String(vi.mocked(fetch).mock.calls.at(-1)?.[0]);
      expect(lastCallUrl).toContain("/api/products/241258");
    });
  });

  it("toggles the wishlist button and shows Add to Cart feedback", async () => {
    mockFetchOnce(buildProduct());
    renderProductPage("/wedding-rings/low-dome-basket-lab-grown-diamond-eternity-ring-item-241257");
    await screen.findByRole("heading", { name: "Low Dome Basket Lab-Grown Diamond Eternity Ring" });

    fireEvent.click(screen.getByRole("button", { name: "Add to Wishlist" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add to Wishlist" })).toHaveAttribute("aria-pressed", "true")
    );

    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));
    expect(screen.getByRole("button", { name: "Added ✓" })).toBeInTheDocument();
  });

  it("expands the Product Details accordion on click", async () => {
    mockFetchOnce(buildProduct());
    renderProductPage("/wedding-rings/low-dome-basket-lab-grown-diamond-eternity-ring-item-241257");
    await screen.findByRole("heading", { name: "Low Dome Basket Lab-Grown Diamond Eternity Ring" });

    expect(screen.getByText(/free shipping, a complimentary appraisal/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Product Details" }));
    expect(screen.getByText(/finished with hand-set craftsmanship/i)).toBeInTheDocument();
  });
});
