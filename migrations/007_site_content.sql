CREATE TABLE IF NOT EXISTS site_content (
  key        TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  value      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO site_content (key, label, value) VALUES
  ('business_name',          'Business Name',           'Special Need Vehicle Rental'),
  ('business_abn',           'ABN',                     ''),
  ('business_phone',         'Phone Number',            '0434 620 086'),
  ('business_address',       'Business Address',        '483 Hume Highway, Yagoona NSW 2199'),
  ('business_email',         'Contact Email',           ''),
  ('business_hours',         'Trading Hours',           'Mon – Sat · 8:00 AM – 6:00 PM AEST'),
  ('hero_headline',          'Hero Headline',           'Special Need Vehicle Rental'),
  ('hero_subheadline',       'Hero Subheadline',        'Our vehicles, available to you — safe, accessible hire for our community.'),
  ('hero_tagline',           'Hero Tagline',            'The same fleet our elderly care residents rely on, available to hire when not in use. Trusted, insured, and ready.'),
  ('hero_cta_text',          'Hero CTA Button Text',    'Check Availability'),
  ('banner_enabled',         'Announcement Banner',     '0'),
  ('banner_message',         'Banner Message',          ''),
  ('maintenance_enabled',    'Maintenance Mode',        '0'),
  ('maintenance_message',    'Maintenance Message',     'The site is currently undergoing scheduled maintenance. We will be back shortly.'),
  ('maintenance_start',      'Maintenance Start',       ''),
  ('maintenance_end',        'Maintenance End',         ''),
  ('legal_terms_filename',   'T&C Document Filename',   ''),
  ('legal_privacy_filename', 'Privacy Policy Filename', '');
