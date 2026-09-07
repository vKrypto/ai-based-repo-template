import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProductCard } from "./ProductCard.js";
import { WishlistProvider } from "../contexts/WishlistContext.js";
import type { ProductListItemDTO } from "../lib/catalogTypes.js";

function buildItem(overrides: Partial<ProductListItemDTO> = {}): ProductListItemDTO {
  return {
    productId: 1,
    itemId: "241257",
    name: "Low Dome Basket Lab-Grown Diamond Eternity Ring In 14K White Gold",
    slug: "low-dome-basket-lab-grown-diamond-eternity-ring-in-14k-white-gold",
    price: 2620,
    compareAtPrice: null,
    imageUrl: "https://ion.bluenile.com/example.jpg",
    hoverMedia: null,
    metal: "14K White Gold",
    diamondType: "Lab-Grown Diamond",
    totalCarat: 3,
    stoneShape: "Round",
    avgRating: 4.8,
    reviewCount: 27,
    ...overrides
  };
}

function renderCard(item: ProductListItemDTO, categorySlug = "wedding-rings"): ReturnType<typeof render> {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ items: [] }) }));
  return render(
    <MemoryRouter>
      <WishlistProvider>
        <ProductCard item={item} categorySlug={categorySlug} />
      </WishlistProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ProductCard", () => {
  it("links the product name to its PDP path", () => {
    renderCard(buildItem());

    const links = screen.getAllByRole("link", {
      name: "Low Dome Basket Lab-Grown Diamond Eternity Ring In 14K White Gold"
    });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute(
        "href",
        "/wedding-rings/low-dome-basket-lab-grown-diamond-eternity-ring-in-14k-white-gold-item-241257"
      );
    }
  });

  it("renders the formatted price", () => {
    renderCard(buildItem({ price: 2620 }));

    expect(screen.getByText("$2,620")).toBeInTheDocument();
  });

  it("renders the original price struck through and a discount badge when compareAtPrice is set", () => {
    renderCard(buildItem({ price: 2620, compareAtPrice: 3200 }));

    expect(screen.getByText("$3,200")).toBeInTheDocument();
    expect(screen.getByText("$2,620")).toBeInTheDocument();
    expect(screen.getByText("-18%")).toBeInTheDocument();
  });

  it("shows only the single price with no badge when there is no compareAtPrice", () => {
    renderCard(buildItem({ price: 2620, compareAtPrice: null }));

    expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
  });

  it("renders metal and diamond type tags when present", () => {
    renderCard(buildItem());

    expect(screen.getByText("14K White Gold")).toBeInTheDocument();
    expect(screen.getByText("Lab-Grown Diamond")).toBeInTheDocument();
  });

  it("shows a rating when the product has reviews", () => {
    renderCard(buildItem({ avgRating: 4.8, reviewCount: 27 }));

    expect(screen.getByText("(27)")).toBeInTheDocument();
  });

  it("hides the rating when the product has no reviews", () => {
    renderCard(buildItem({ avgRating: null, reviewCount: 0 }));

    expect(screen.queryByTestId("product-rating")).not.toBeInTheDocument();
  });

  it("falls back to the placeholder image when imageUrl is null", () => {
    renderCard(buildItem({ imageUrl: null }));

    expect(screen.getByRole("img")).toHaveAttribute("src", "/placeholder-product.svg");
  });

  it("renders a wishlist button for the item", () => {
    renderCard(buildItem());

    expect(screen.getByRole("button", { name: "Add to Wishlist" })).toBeInTheDocument();
  });

  it("does not render a video element before hovering, even when hoverMedia is a video", () => {
    renderCard(buildItem({ hoverMedia: { url: "https://example.com/clip.mp4", mediaType: "video" } }));

    expect(document.querySelector("video")).not.toBeInTheDocument();
  });

  it("swaps to the hover image on mouse enter and reverts on mouse leave", () => {
    renderCard(buildItem({ hoverMedia: { url: "https://example.com/hover.jpg", mediaType: "image" } }));

    const wrapper = document.querySelector('[class*="imageLink"]')!;

    fireEvent.mouseEnter(wrapper);
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/hover.jpg");

    fireEvent.mouseLeave(wrapper);
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://ion.bluenile.com/example.jpg");
  });

  it("mounts a deferred, poster-backed video on mouse enter when hoverMedia is a video, and removes it on mouse leave", () => {
    renderCard(buildItem({ hoverMedia: { url: "https://example.com/clip.mp4", mediaType: "video" } }));

    const wrapper = document.querySelector('[class*="imageLink"]')!;
    fireEvent.mouseEnter(wrapper);

    const video = document.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("preload", "none");
    expect(video).toHaveAttribute("poster", "https://ion.bluenile.com/example.jpg");
    expect(video?.querySelector("source")).toHaveAttribute("src", "https://example.com/clip.mp4");

    fireEvent.mouseLeave(wrapper);
    expect(document.querySelector("video")).not.toBeInTheDocument();
  });
});
