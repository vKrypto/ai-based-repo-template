import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RingSizeSelector } from "./RingSizeSelector.js";

describe("RingSizeSelector", () => {
  it("renders a select defaulting to a prompt option, plus the standard ring sizes", () => {
    render(<RingSizeSelector />);

    const select = screen.getByLabelText("Ring Size:");
    expect(select).toHaveValue("");
    expect(screen.getByRole("option", { name: "Select" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "7" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "7.5" })).toBeInTheDocument();
  });
});
