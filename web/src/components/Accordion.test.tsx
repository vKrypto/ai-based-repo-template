import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Accordion } from "./Accordion.js";

describe("Accordion", () => {
  it("is collapsed by default and shows content after being toggled open", () => {
    render(
      <Accordion title="Product Details">
        <p>Some detail copy.</p>
      </Accordion>
    );

    expect(screen.queryByText("Some detail copy.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Product Details" }));
    expect(screen.getByText("Some detail copy.")).toBeInTheDocument();
  });

  it("renders open by default when defaultOpen is set", () => {
    render(
      <Accordion title="Your Order Includes" defaultOpen>
        <p>Free shipping.</p>
      </Accordion>
    );

    expect(screen.getByText("Free shipping.")).toBeInTheDocument();
  });

  it("collapses again when toggled a second time", () => {
    render(
      <Accordion title="Secure Shopping" defaultOpen>
        <p>We keep your order safe.</p>
      </Accordion>
    );

    fireEvent.click(screen.getByRole("button", { name: "Secure Shopping" }));
    expect(screen.queryByText("We keep your order safe.")).not.toBeInTheDocument();
  });
});
