import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { OrderConfirmationPage } from "./OrderConfirmationPage.js";
import type { OrderDTO } from "../lib/orderTypes.js";

function buildOrder(overrides: Partial<OrderDTO> = {}): OrderDTO {
  return {
    orderId: 42,
    status: "placed",
    subtotal: 2000,
    shippingAddress: {
      name: "Ada Lovelace",
      line1: "123 Main St",
      line2: null,
      city: "London",
      state: "England",
      postalCode: "SW1A 1AA",
      country: "United Kingdom",
      phone: null
    },
    items: [
      {
        itemId: "241257",
        name: "Low Dome Basket Ring",
        price: 1000,
        quantity: 2,
        imageUrl: null,
        lineTotal: 2000
      }
    ],
    createdAt: "2026-07-03T00:00:00.000Z",
    ...overrides
  };
}

function mockFetchOnce(body: unknown, status = 200): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) })
  );
}

function renderConfirmationPage(orderId = "42"): void {
  render(
    <MemoryRouter initialEntries={[`/order-confirmation/${orderId}`]}>
      <Routes>
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OrderConfirmationPage", () => {
  it("renders the order number, items and shipping address once loaded", async () => {
    mockFetchOnce(buildOrder());
    renderConfirmationPage();

    expect(await screen.findByText(/order #42/i)).toBeInTheDocument();
    expect(screen.getByText("Low Dome Basket Ring")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText(/123 main st/i)).toBeInTheDocument();
    expect(screen.getAllByText("$2,000").length).toBeGreaterThan(0);
  });

  it("shows a not-found message for an unknown order id", async () => {
    mockFetchOnce({ message: "order not found" }, 404);
    renderConfirmationPage("999999");

    expect(await screen.findByText(/this order could not be found/i)).toBeInTheDocument();
  });
});
