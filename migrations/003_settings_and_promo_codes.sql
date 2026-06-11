-- ============================================================
-- migrations/003_settings_and_promo_codes.sql
-- Global settings table and promo codes for special rate discounts
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed the special rate discount setting (0 = no discount by default)
INSERT OR IGNORE INTO settings (key, value) VALUES ('special_rate_discount_percent', '0');

-- Promo codes (one-time use, grants special daily rate discount)
CREATE TABLE IF NOT EXISTS promo_codes (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  code                 TEXT    NOT NULL UNIQUE,
  generated_by         TEXT    NOT NULL DEFAULT 'admin',
  status               TEXT    NOT NULL DEFAULT 'active',  -- 'active' | 'used' | 'expired' | 'disabled'
  expires_at           TEXT,                               -- optional ISO UTC expiry (nullable)
  used_at              TEXT,
  used_reservation_id  INTEGER REFERENCES reservations(id),
  created_at           TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_promo_code   ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_status ON promo_codes(status);

-- Extend reservations to record applied promo
ALTER TABLE reservations ADD COLUMN promo_code_id          INTEGER REFERENCES promo_codes(id);
ALTER TABLE reservations ADD COLUMN promo_discount_percent INTEGER NOT NULL DEFAULT 0;
