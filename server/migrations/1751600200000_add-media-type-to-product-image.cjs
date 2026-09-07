exports.up = (pgm) => {
  pgm.addColumn("product_image", {
    media_type: { type: "text", notNull: true, default: "image" }
  });
  pgm.addConstraint("product_image", "product_image_media_type_check", {
    check: "media_type IN ('image', 'video')"
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint("product_image", "product_image_media_type_check");
  pgm.dropColumn("product_image", "media_type");
};
