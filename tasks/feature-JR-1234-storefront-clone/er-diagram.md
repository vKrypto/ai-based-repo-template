No existing ER diagram in the repo — this is the initial data model for the storefront.

```mermaid
erDiagram
  CATEGORY ||--o{ CATEGORY : "has subcategory"
  CATEGORY ||--o{ PRODUCT : "contains"
  PRODUCT ||--o{ PRODUCT_VARIANT : "has"
  PRODUCT_VARIANT ||--o{ PRODUCT_IMAGE : "has"
  PRODUCT_VARIANT ||--o{ VARIANT_ATTRIBUTE_VALUE : "tagged with"
  ATTRIBUTE ||--o{ ATTRIBUTE_VALUE : "defines"
  ATTRIBUTE_VALUE ||--o{ VARIANT_ATTRIBUTE_VALUE : "assigned via"

  CATEGORY {
    int id PK
    string slug
    string name
    int parent_id FK "nullable, self-reference"
    text description
  }
  PRODUCT {
    int id PK
    int category_id FK
    string name
    string base_slug
    decimal avg_rating
    int review_count
    string source_url "Blue Nile source page, for re-ingestion"
    timestamp created_at
    timestamp updated_at
  }
  PRODUCT_VARIANT {
    int id PK
    int product_id FK
    string item_id "the trailing id in the URL, e.g. 241257 — unique, real lookup key"
    string slug "cosmetic/SEO copy of properties, never used alone for lookup"
    decimal price
    boolean is_default
    string ships_by
  }
  PRODUCT_IMAGE {
    int id PK
    int variant_id FK
    string url
    int position
    string alt_text
  }
  ATTRIBUTE {
    int id PK
    string name "e.g. Metal Type, Diamond Type, Carat Weight, Stone Shape"
    string filter_key "query-param key used on the PLP"
  }
  ATTRIBUTE_VALUE {
    int id PK
    int attribute_id FK
    string value "e.g. 14k-white-gold"
    string display_label "e.g. 14K White Gold"
  }
  VARIANT_ATTRIBUTE_VALUE {
    int variant_id FK
    int attribute_value_id FK
  }
  STATIC_PAGE {
    int id PK
    string slug "e.g. terms-conditions"
    string title
    text content_html
    timestamp updated_at
  }
```

Notes:
- `PRODUCT` is the "style" (e.g. *Low Dome Basket Lab-Grown Diamond Eternity Ring*); `PRODUCT_VARIANT` is the specific sellable configuration addressed by the URL's trailing `item_id`. This mirrors Blue Nile's own PDP, where changing metal/carat/diamond type on one page can move you to a different `item-#####`.
- `VARIANT_ATTRIBUTE_VALUE` is the single source of truth for both the PDP's variant selectors and the PLP's filter chips — no duplicated attribute data between the two pages.
- No table is proposed for the 1-day TTL cache — it is an application-level, in-memory construct (see [technical-design.md](technical-design.md)), not durable state, so it doesn't belong in the schema.
