import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CatalogPage } from "./CatalogPage.js";
import { WishlistProvider } from "../contexts/WishlistContext.js";
import type { CatalogResponseDTO, ProductListItemDTO } from "../lib/catalogTypes.js";

function buildItem(overrides: Partial<ProductListItemDTO> = {}): ProductListItemDTO {
  return {
    productId: 1,
    itemId: "241257",
    name: "Low Dome Basket Lab-Grown Diamond Eternity Ring",
    slug: "low-dome-basket-lab-grown-diamond-eternity-ring",
    price: 2620,
    compareAtPrice: null,
    imageUrl: null,
    hoverMedia: null,
    metal: "14K White Gold",
    diamondType: "Lab-Grown Diamond",
    totalCarat: 3,
    stoneShape: "Round",
    avgRating: null,
    reviewCount: 0,
    ...overrides
  };
}

function buildResponse(overrides: Partial<CatalogResponseDTO> = {}): CatalogResponseDTO {
  return {
    items: [buildItem()],
    total: 1,
    page: 1,
    pageSize: 24,
    availableFilters: [
      {
        key: "metal",
        label: "Metal Type",
        values: [{ value: "14K White Gold", label: "14K White Gold", count: 1 }]
      }
    ],
    ...overrides
  };
}

class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  trigger(isIntersecting: boolean): void {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this);
  }
}

function mockFetchSequence(...bodies: Array<{ body: unknown; status?: number }>): void {
  let callIndex = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/wishlist")) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ items: [] }) });
      }
      const { body, status = 200 } = bodies[Math.min(callIndex, bodies.length - 1)]!;
      callIndex += 1;
      return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });
    })
  );
}

function catalogFetchUrls(): string[] {
  return vi
    .mocked(fetch)
    .mock.calls.map((call) => String(call[0]))
    .filter((url) => url.includes("/api/categories"));
}

function mockFetchOnce(body: unknown, status = 200): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body)
    })
  );
}

function renderCatalogPage(initialEntry = "/wedding-rings"): void {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <WishlistProvider>
        <Routes>
          <Route path="/:category" element={<CatalogPage />} />
        </Routes>
      </WishlistProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CatalogPage", () => {
  it("renders the breadcrumb, title and product grid once data loads", async () => {
    mockFetchOnce(buildResponse());
    renderCatalogPage();

    expect(await screen.findByRole("heading", { name: "Shop Wedding Rings" })).toBeInTheDocument();
    expect(screen.getByText("Wedding Rings", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Low Dome Basket Lab-Grown Diamond Eternity Ring")).toBeInTheDocument();
    expect(screen.getByText("1 Result")).toBeInTheDocument();
  });

  it("shows an explicit empty state when there are zero results", async () => {
    mockFetchOnce(buildResponse({ items: [], total: 0 }));
    renderCatalogPage();

    expect(await screen.findByText(/no products match/i)).toBeInTheDocument();
  });

  it("shows a not-found message for an unknown category", async () => {
    mockFetchOnce({ message: "category not found" }, 404);
    renderCatalogPage("/not-a-real-category");

    expect(await screen.findByText(/this category could not be found/i)).toBeInTheDocument();
  });

  it("refetches with the selected filter applied", async () => {
    mockFetchOnce(buildResponse());
    renderCatalogPage();
    await screen.findByRole("heading", { name: "Shop Wedding Rings" });

    fireEvent.change(screen.getByLabelText("Metal"), { target: { value: "14K White Gold" } });

    await waitFor(() => {
      const lastCallUrl = String(vi.mocked(fetch).mock.calls.at(-1)?.[0]);
      expect(lastCallUrl).toContain("metal=14K+White+Gold");
    });
  });

  it("loads the next page and appends it to the grid when the sentinel intersects", async () => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    mockFetchSequence(
      { body: buildResponse({ items: [buildItem({ itemId: "241257", name: "Ring One" })], total: 2, page: 1 }) },
      { body: buildResponse({ items: [buildItem({ itemId: "999999", name: "Ring Two" })], total: 2, page: 2 }) }
    );

    renderCatalogPage();
    await screen.findByText("Ring One");

    const observer = MockIntersectionObserver.instances.at(-1);
    expect(observer).toBeDefined();
    act(() => observer!.trigger(true));

    expect(await screen.findByText("Ring Two")).toBeInTheDocument();
    expect(screen.getByText("Ring One")).toBeInTheDocument();
    expect(catalogFetchUrls()).toHaveLength(2);
    expect(catalogFetchUrls().at(-1)).toContain("page=2");
  });

  it("stops requesting more pages once every item has been loaded", async () => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    mockFetchSequence({ body: buildResponse({ total: 1 }) });

    renderCatalogPage();
    await screen.findByText("Low Dome Basket Lab-Grown Diamond Eternity Ring");

    expect(MockIntersectionObserver.instances).toHaveLength(0);
    expect(catalogFetchUrls()).toHaveLength(1);
  });

  it("resets the accumulated items back to a single page when filters change", async () => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    mockFetchSequence(
      { body: buildResponse({ items: [buildItem({ itemId: "241257", name: "Ring One" })], total: 2, page: 1 }) },
      { body: buildResponse({ items: [buildItem({ itemId: "999999", name: "Ring Two" })], total: 2, page: 2 }) },
      { body: buildResponse({ items: [buildItem({ itemId: "555555", name: "Filtered Ring" })], total: 1, page: 1 }) }
    );

    renderCatalogPage();
    await screen.findByText("Ring One");
    act(() => MockIntersectionObserver.instances.at(-1)!.trigger(true));
    await screen.findByText("Ring Two");

    fireEvent.change(screen.getByLabelText("Metal"), { target: { value: "14K White Gold" } });

    expect(await screen.findByText("Filtered Ring")).toBeInTheDocument();
    expect(screen.queryByText("Ring One")).not.toBeInTheDocument();
    expect(screen.queryByText("Ring Two")).not.toBeInTheDocument();
  });
});
