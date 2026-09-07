import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { StaticPage } from "./StaticPage.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("StaticPage", () => {
  it("renders the fetched page title and content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            slug: "terms-conditions",
            title: "Terms & Conditions",
            contentHtml: "<p>Placeholder terms and conditions content.</p>",
            updatedAt: "2026-01-01T00:00:00.000Z"
          })
      })
    );

    render(<StaticPage slug="terms-conditions" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Terms & Conditions" })).toBeInTheDocument();
    });
    expect(screen.getByText("Placeholder terms and conditions content.")).toBeInTheDocument();
  });

  it("shows an error message when the page cannot be loaded", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }));

    render(<StaticPage slug="does-not-exist" />);

    await waitFor(() => {
      expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
    });
  });
});
