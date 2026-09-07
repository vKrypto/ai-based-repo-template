exports.up = (pgm) => {
  pgm.addColumn("product_variant", {
    compare_at_price: { type: "numeric(10,2)" }
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("product_variant", "compare_at_price");
};
