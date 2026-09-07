## Summary
- What: Build a low-infra e-commerce storefront for **BareBrilliant** (natural + lab-grown diamond jewellery) — global header/footer, static content pages, a product catalog (PLP) and product detail pages (PDP) — styled as a close replica of Blue Nile's `wedding-rings` catalog and PDP layout for a fast v1 launch.
- Why: Ship a credible, familiar-feeling storefront quickly on minimal infra (~1,000 SKUs, single Postgres instance, single Node/React stack, 1-day TTL in-memory cache — no Redis, no CDN, no search cluster) while reusing a proven jewellery e-commerce UX pattern instead of designing one from scratch.

## Acceptance criteria

### Phase 1 — Layout & static pages
- [ ] Header (logo, nav: Engagement Rings / Rings / Earrings / Bracelets / Necklaces / Diamonds / Gemstones / Gifts) and Footer render on every route
- [ ] Static pages render at `/terms-conditions`, `/privacy-policy`, `/shipping-returns`, `/about-us`, `/contact-us`
- [ ] Responsive at mobile (375px) and desktop (1280px+) breakpoints

### Phase 2 — Catalog (PLP)
- [ ] `GET /{category_slug}` (e.g. `/wedding-rings`) renders a catalog grid backed by Postgres
- [ ] Filters (metal, stone shape, carat, diamond type, price, etc.) narrow results and are reflected as URL query params (shareable/bookmarkable)
- [ ] Pagination works end-to-end (page size matches source default)
- [ ] In-category search narrows the grid
- [ ] Product images load from the same source CDN URLs for now (see Out of scope)
- [ ] Catalog responses are served from a 1-day TTL in-memory cache; a miss populates from Postgres and repopulates the cache
- [ ] Verified on both mobile and desktop viewports

### Phase 3 — PDP
- [ ] `GET /{category_slug}/{product_slug}-item-{product_id}` renders full product detail
- [ ] `product_slug` is derived from the product's own properties (metal, diamond type, carat, etc.); those same properties double as PLP filter values — single source of truth, not two copies of the same data
- [ ] Variant selectors (metal type, carat weight, diamond type) update price/images client-side without a full page reload
- [ ] Verified on both mobile and desktop viewports

## Edge cases
- Product with a single fixed configuration (no selectable variants) — hide selectors instead of rendering them empty
- Filtered/searched query returns zero results — show an explicit empty state, not a blank grid
- Cache entry expires mid-traffic (TTL boundary) — treated as a normal cache miss that blocks on Postgres; no stale-while-revalidate in v1
- Two products would generate the same slug text — the trailing `product_id` is the only real lookup key; the slug segment is cosmetic/SEO and is never used alone to resolve a product
- Source image URL is missing/broken — render a placeholder, never break page layout
- Category slug in the URL doesn't exist — return a proper 404 page, not an empty catalog

## Out of scope (v1)
- Cart, checkout, payments, accounts/auth
- Cross-category search (only in-category search per Phase 2)
- Any content Blue Nile doesn't expose on the specific public pages being cloned
- Replacing hotlinked source images with BareBrilliant's own licensed photography — **required before any public launch**, tracked as a known follow-up in [technical-design.md](technical-design.md) risk #1, not solved in this task
