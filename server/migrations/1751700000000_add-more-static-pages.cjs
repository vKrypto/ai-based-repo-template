exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO static_page (slug, title, content_html) VALUES
      ('craftsmanship', 'Craftsmanship', '<p>Placeholder craftsmanship content.</p>'),
      ('authenticity-certification', 'Authenticity & Certification', '<p>Placeholder authenticity and certification content.</p>'),
      ('diamond-buying-guide', 'Diamond Buying Guide', '<p>Placeholder diamond buying guide content.</p>'),
      ('faqs', 'FAQs', '<p>Placeholder FAQ content.</p>'),
      ('book-appointment', 'Book an Appointment', '<p>Placeholder appointment booking content.</p>')
    ON CONFLICT (slug) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM static_page
    WHERE slug IN ('craftsmanship', 'authenticity-certification', 'diamond-buying-guide', 'faqs', 'book-appointment');
  `);
};
