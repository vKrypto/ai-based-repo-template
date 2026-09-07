exports.up = (pgm) => {
  pgm.createTable("static_page", {
    id: "id",
    slug: { type: "text", notNull: true, unique: true },
    title: { type: "text", notNull: true },
    content_html: { type: "text", notNull: true },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.sql(`
    INSERT INTO static_page (slug, title, content_html) VALUES
      ('terms-conditions', 'Terms & Conditions', '<p>Placeholder terms and conditions content.</p>'),
      ('privacy-policy', 'Privacy Policy', '<p>Placeholder privacy policy content.</p>'),
      ('shipping-returns', 'Shipping & Returns', '<p>Placeholder shipping and returns content.</p>'),
      ('about-us', 'About Us', '<p>Placeholder about us content.</p>'),
      ('contact-us', 'Contact Us', '<p>Placeholder contact us content.</p>')
    ON CONFLICT (slug) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.dropTable("static_page");
};
