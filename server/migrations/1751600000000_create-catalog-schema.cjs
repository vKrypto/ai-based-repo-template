exports.up = (pgm) => {
  pgm.createTable("category", {
    id: "id",
    slug: { type: "text", notNull: true, unique: true },
    name: { type: "text", notNull: true },
    parent_id: { type: "integer", references: "category", onDelete: "SET NULL" },
    description: { type: "text" }
  });

  pgm.createTable("product", {
    id: "id",
    category_id: { type: "integer", notNull: true, references: "category", onDelete: "CASCADE" },
    name: { type: "text", notNull: true },
    base_slug: { type: "text", notNull: true },
    avg_rating: { type: "numeric(2,1)" },
    review_count: { type: "integer", notNull: true, default: 0 },
    source_url: { type: "text" },
    is_synthetic: { type: "boolean", notNull: true, default: false },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.createIndex("product", "category_id");

  pgm.createTable("product_variant", {
    id: "id",
    product_id: { type: "integer", notNull: true, references: "product", onDelete: "CASCADE" },
    item_id: { type: "text", notNull: true, unique: true },
    slug: { type: "text", notNull: true },
    price: { type: "numeric(10,2)", notNull: true },
    is_default: { type: "boolean", notNull: true, default: false },
    ships_by: { type: "text" }
  });

  pgm.createTable("product_image", {
    id: "id",
    variant_id: { type: "integer", notNull: true, references: "product_variant", onDelete: "CASCADE" },
    url: { type: "text", notNull: true },
    position: { type: "integer", notNull: true, default: 0 },
    alt_text: { type: "text" }
  });
  pgm.createIndex("product_image", "variant_id");

  pgm.createTable("attribute", {
    id: "id",
    name: { type: "text", notNull: true, unique: true },
    filter_key: { type: "text", notNull: true, unique: true }
  });

  pgm.createTable("attribute_value", {
    id: "id",
    attribute_id: { type: "integer", notNull: true, references: "attribute", onDelete: "CASCADE" },
    value: { type: "text", notNull: true },
    display_label: { type: "text", notNull: true }
  });
  pgm.addConstraint("attribute_value", "attribute_value_attribute_id_value_key", {
    unique: ["attribute_id", "value"]
  });

  pgm.createTable("variant_attribute_value", {
    variant_id: { type: "integer", notNull: true, references: "product_variant", onDelete: "CASCADE" },
    attribute_value_id: { type: "integer", notNull: true, references: "attribute_value", onDelete: "CASCADE" }
  });
  pgm.addConstraint("variant_attribute_value", "variant_attribute_value_pkey", {
    primaryKey: ["variant_id", "attribute_value_id"]
  });
};

exports.down = (pgm) => {
  pgm.dropTable("variant_attribute_value");
  pgm.dropTable("attribute_value");
  pgm.dropTable("attribute");
  pgm.dropTable("product_image");
  pgm.dropTable("product_variant");
  pgm.dropTable("product");
  pgm.dropTable("category");
};
