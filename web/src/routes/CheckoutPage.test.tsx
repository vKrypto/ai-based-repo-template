import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CheckoutPage } from "./CheckoutPage.js";
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

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response;
}

function mockFetchRouter(cartBody: unknown, orderResponse: { body: unknown; status?: number }): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/cart")) {
        return Promise.resolve(jsonResponse(cartBody));
      }
      if (url.includes("/api/orders") && init?.method === "POST") {
        return Promise.resolve(jsonResponse(orderResponse.body, orderResponse.status));
      }
      return Promise.resolve(jsonResponse({}));
    })
  );
}

function fillAddress(): void {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Ada Lovelace" } });
  fireEvent.change(screen.getByLabelText(/address line 1/i), { target: { value: "123 Main St" } });
  fireEvent.change(screen.getByLabelText(/^city$/i), { target: { value: "London" } });
  fireEvent.change(screen.getByLabelText(/^state$/i), { target: { value: "England" } });
  fireEvent.change(screen.getByLabelText(/postal code/i), { target: { value: "SW1A 1AA" } });
  fireEvent.change(screen.getByLabelText(/^country$/i), { target: { value: "United Kingdom" } });
}

function renderCheckoutPage(): void {
  render(
    <MemoryRouter initialEntries={["/checkout"]}>
      <CartProvider>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:orderId" element={<p>Confirmation page</p>} />
        </Routes>
      </CartProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CheckoutPage", () => {
  it("shows an empty-cart message with no address form when the cart is empty", async () => {
    mockFetchRouter({ items: [], itemCount: 0, subtotal: 0 }, { body: {} });
    renderCheckoutPage();

    expect(await screen.findByText(/your cart is empty/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });

  it("renders the order summary with items and subtotal", async () => {
    mockFetchRouter(buildCart(), { body: {} });
    renderCheckoutPage();

    expect(await screen.findByText("Low Dome Basket Ring")).toBeInTheDocument();
    expect(screen.getAllByText("$2,000").length).toBeGreaterThan(0);
  });

  it("places the order and navigates to the confirmation page on success", async () => {
    mockFetchRouter(buildCart(), { body: { orderId: 42 }, status: 201 });
    renderCheckoutPage();
    await screen.findByText("Low Dome Basket Ring");

    fillAddress();
    fireEvent.click(screen.getByRole("button", { name: /place order/i }));

    expect(await screen.findByText("Confirmation page")).toBeInTheDocument();
  });

  it("shows an error message when the order fails to place", async () => {
    mockFetchRouter(buildCart(), { body: { message: "cart is empty" }, status: 400 });
    renderCheckoutPage();
    await screen.findByText("Low Dome Basket Ring");

    fillAddress();
    fireEvent.click(screen.getByRole("button", { name: /place order/i }));

    expect(await screen.findByText(/something went wrong placing your order/i)).toBeInTheDocument();
  });

  it("refreshes the cart so the header count updates once the order is placed", async () => {
    const cartGetCalls: number[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/orders") && init?.method === "POST") {
          return Promise.resolve(jsonResponse({ orderId: 42 }, 201));
        }
        if (url.includes("/api/cart")) {
          cartGetCalls.push(1);
          const body = cartGetCalls.length === 1 ? buildCart() : { items: [], itemCount: 0, subtotal: 0 };
          return Promise.resolve(jsonResponse(body));
        }
        return Promise.resolve(jsonResponse({}));
      })
    );
    renderCheckoutPage();
    await screen.findByText("Low Dome Basket Ring");

    fillAddress();
    fireEvent.click(screen.getByRole("button", { name: /place order/i }));

    await screen.findByText("Confirmation page");
    expect(cartGetCalls.length).toBe(2);
  });
});
