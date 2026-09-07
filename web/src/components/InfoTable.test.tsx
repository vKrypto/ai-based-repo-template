import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InfoTable } from "./InfoTable.js";

describe("InfoTable", () => {
  it("renders a row per label/value pair", () => {
    render(
      <InfoTable
        rows={[
          { label: "Stock Number", value: "241257" },
          { label: "Metal", value: "14K White Gold" }
        ]}
      />
    );

    expect(screen.getByText("Stock Number")).toBeInTheDocument();
    expect(screen.getByText("241257")).toBeInTheDocument();
    expect(screen.getByText("Metal")).toBeInTheDocument();
    expect(screen.getByText("14K White Gold")).toBeInTheDocument();
  });
});
