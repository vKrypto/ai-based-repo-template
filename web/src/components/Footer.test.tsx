import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Footer } from "./Footer.js";

function renderFooter(): void {
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );
}

describe("Footer", () => {
  it("links to every static content page across all groups", () => {
    renderFooter();

    expect(screen.getByRole("link", { name: "Our Story" })).toHaveAttribute("href", "/about-us");
    expect(screen.getByRole("link", { name: "Craftsmanship" })).toHaveAttribute("href", "/craftsmanship");
    expect(screen.getByRole("link", { name: "Authenticity & Certification" })).toHaveAttribute(
      "href",
      "/authenticity-certification"
    );
    expect(screen.getByRole("link", { name: "Diamond Buying Guide" })).toHaveAttribute(
      "href",
      "/diamond-buying-guide"
    );
    expect(screen.getByRole("link", { name: "FAQs" })).toHaveAttribute("href", "/faqs");
    expect(screen.getByRole("link", { name: "Shipping & Returns" })).toHaveAttribute("href", "/shipping-returns");
    expect(screen.getByRole("link", { name: "Terms & Conditions" })).toHaveAttribute("href", "/terms-conditions");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy-policy");
    expect(screen.getByRole("link", { name: "Contact Us" })).toHaveAttribute("href", "/contact-us");
    expect(screen.getByRole("link", { name: "Book an Appointment" })).toHaveAttribute("href", "/book-appointment");
  });

  it("renders a heading for every link group", () => {
    renderFooter();

    expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Guides" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Policies" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contact" })).toBeInTheDocument();
  });

  it("shows a copyright line", () => {
    renderFooter();

    expect(screen.getByText(/Bare Brilliant/)).toBeInTheDocument();
  });

  it("shows a thank-you message after submitting the newsletter form with an email", () => {
    renderFooter();

    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "ada@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));

    expect(screen.getByText(/thanks/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Email address")).not.toBeInTheDocument();
  });

  it("does not submit the newsletter form when the email is blank", () => {
    renderFooter();

    fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));

    expect(screen.queryByText(/thanks/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
  });
});
