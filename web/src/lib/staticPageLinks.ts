export interface StaticPageLink {
  label: string;
  slug: string;
}

export interface FooterLinkGroup {
  heading: string;
  links: StaticPageLink[];
}

export const FOOTER_LINK_GROUPS: FooterLinkGroup[] = [
  {
    heading: "About",
    links: [
      { label: "Our Story", slug: "about-us" },
      { label: "Craftsmanship", slug: "craftsmanship" },
      { label: "Authenticity & Certification", slug: "authenticity-certification" }
    ]
  },
  {
    heading: "Guides",
    links: [
      { label: "Diamond Buying Guide", slug: "diamond-buying-guide" },
      { label: "FAQs", slug: "faqs" },
      { label: "Shipping & Returns", slug: "shipping-returns" }
    ]
  },
  {
    heading: "Policies",
    links: [
      { label: "Terms & Conditions", slug: "terms-conditions" },
      { label: "Privacy Policy", slug: "privacy-policy" }
    ]
  },
  {
    heading: "Contact",
    links: [
      { label: "Contact Us", slug: "contact-us" },
      { label: "Book an Appointment", slug: "book-appointment" }
    ]
  }
];

// STATIC_PAGE_LINKS is the flat, deduplicated list of every routable static page,
// derived from FOOTER_LINK_GROUPS so route registration and footer content never drift apart.
export const STATIC_PAGE_LINKS: StaticPageLink[] = FOOTER_LINK_GROUPS.flatMap((group) => group.links);
