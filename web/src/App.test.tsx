import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("renders the header nav and footer on the homepage", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ items: [] }) })
    );

    render(<App />);

    expect(screen.getByRole("link", { name: "Rings" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Bare Brilliant");
    expect(screen.getByRole("link", { name: "Terms & Conditions" })).toBeInTheDocument();
  });
});
