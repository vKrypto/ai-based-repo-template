Parent branch: `feature/JR-1234-storefront-clone`

### Task 1: Project scaffolding
- Scope: Init Node.js backend (Express) and React frontend (Vite) as a monorepo (`/server`, `/web`); Postgres connection + migration tooling in `shared/db`; empty `features/{catalog,products,pages}` skeletons per `rules/architecture.md`; CI baseline running `npm run test`, `tsc --noEmit`, `npm run lint`
- Test criteria: `npm run test -- --watch=false`, `tsc --noEmit`, `npm run lint` all run green on an empty/placeholder test suite; server boots and connects to Postgres
- Branch: `feature/JR-1234-task1-scaffolding`
- Depends on: none

### Task 2: Layout & static pages — done
- Scope: Header/Footer components, app shell routing, `pages` feature module (controller/service/repository) serving `/terms-conditions`, `/privacy-policy`, `/shipping-returns`, `/about-us`, `/contact-us` from Postgres-backed content; mobile + desktop responsive
- Test criteria: unit tests for `pages.service`/`pages.repository`; each static route returns 200 and renders Header+Footer; responsive check at 375px and 1280px
- Branch: `feature/JR-1234-task2-layout-pages`
- Depends on: Task 1
- Note: pulled `node-pg-migrate` and the `static_page` table/seed migration into this task (originally scoped to Task 3) since Task 2 needed a persisted content source. Task 3's migration below no longer needs to touch `static_page`.

### Task 3: Catalog data model & ingestion
- Scope: Migration for `category`, `product`, `product_variant`, `product_image`, `attribute`, `attribute_value`, `variant_attribute_value` (per [er-diagram.md](er-diagram.md)) — `static_page` already exists from Task 2; one-off ingestion script under `infra/ingestion` that populates ~1,000 products for the `wedding-rings` category from the source pages, idempotent by `item_id`
- Test criteria: migration runs clean up/down; ingestion script re-run is a no-op on unchanged data (idempotency test); row counts match expected sample after a scoped test run
- Branch: `feature/JR-1234-task3-catalog-data`
- Depends on: Task 1

### Task 4: Catalog API + cache
- Scope: `catalog` feature module — `GET /api/categories/:slug/products` with filter/pagination/search query params, in-memory 1-day TTL cache in `shared/cache`
- Test criteria: unit tests for filter/pagination logic, cache hit vs. miss behavior, 404 on unknown category slug; integration test against a real test Postgres per `rules/testing.md` (no DB mocks)
- Branch: `feature/JR-1234-task4-catalog-api`
- Depends on: Task 3

### Task 5: Catalog page frontend (PLP)
- Scope: `CatalogPage`, `FilterBar`, `Pagination` components consuming the Task 4 API; URL query params reflect active filters/page; mobile + desktop layouts matching the Blue Nile reference styling
- Test criteria: component tests for filter/pagination interactions; manual verification against mobile (375px) and desktop (1280px) viewports; empty-state renders on zero results
- Branch: `feature/JR-1234-task5-catalog-frontend`
- Depends on: Task 4

### Task 6: PDP API
- Scope: `products` feature module — `GET /api/products/:itemId`, sibling-variant assembly, 1-day TTL cache reuse from `shared/cache`
- Test criteria: unit tests for item_id extraction/lookup, sibling-variant assembly, 404 on unknown item_id; integration test against real test Postgres
- Branch: `feature/JR-1234-task6-pdp-api`
- Depends on: Task 3

### Task 7: PDP frontend
- Scope: `ProductPage`, `ImageGallery`, `VariantSelector` components; route parses trailing `-item-{id}`; variant changes update price/images client-side without full reload
- Test criteria: component tests for variant selection updating displayed price/images; manual verification on mobile and desktop; single-variant products hide selectors
- Branch: `feature/JR-1234-task7-pdp-frontend`
- Depends on: Task 6, Task 5 (shares layout primitives)

## Pre-merge quality gate (run once, after Task 7, before final PR into main)
1. `npm run test -- --watch=false` — all green
2. `/pr-review-toolkit:review-pr` against the full `feature/JR-1234-storefront-clone` diff
3. Fix every Critical/Important finding; note Minor findings in `summary.md`
4. Re-run tests; repeat 2–4 until clean
