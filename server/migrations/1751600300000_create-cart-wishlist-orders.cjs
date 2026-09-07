exports.up = (pgm) => {
  pgm.createTable("customer_session", {
    id: "id",
    token: { type: "text", notNull: true, unique: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("cart_item", {
    id: "id",
    session_id: { type: "integer", notNull: true, references: "customer_session", onDelete: "CASCADE" },
    variant_id: { type: "integer", notNull: true, references: "product_variant", onDelete: "CASCADE" },
    quantity: { type: "integer", notNull: true, default: 1 },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("cart_item", "cart_item_session_variant_key", {
    unique: ["session_id", "variant_id"]
  });

  pgm.createTable("wishlist_item", {
    id: "id",
    session_id: { type: "integer", notNull: true, references: "customer_session", onDelete: "CASCADE" },
    variant_id: { type: "integer", notNull: true, references: "product_variant", onDelete: "CASCADE" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("wishlist_item", "wishlist_item_session_variant_key", {
    unique: ["session_id", "variant_id"]
  });

  pgm.createTable("customer_order", {
    id: "id",
    session_id: { type: "integer", references: "customer_session", onDelete: "SET NULL" },
    status: { type: "text", notNull: true, default: "placed" },
    subtotal: { type: "numeric(10,2)", notNull: true },
    shipping_name: { type: "text", notNull: true },
    shipping_line1: { type: "text", notNull: true },
    shipping_line2: { type: "text" },
    shipping_city: { type: "text", notNull: true },
    shipping_state: { type: "text", notNull: true },
    shipping_postal_code: { type: "text", notNull: true },
    shipping_country: { type: "text", notNull: true },
    shipping_phone: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("customer_order_item", {
    id: "id",
    order_id: { type: "integer", notNull: true, references: "customer_order", onDelete: "CASCADE" },
    variant_id: { type: "integer", references: "product_variant", onDelete: "SET NULL" },
    name: { type: "text", notNull: true },
    price: { type: "numeric(10,2)", notNull: true },
    quantity: { type: "integer", notNull: true },
    image_url: { type: "text" }
  });
};

exports.down = (pgm) => {
  pgm.dropTable("customer_order_item");
  pgm.dropTable("customer_order");
  pgm.dropTable("wishlist_item");
  pgm.dropTable("cart_item");
  pgm.dropTable("customer_session");
};
