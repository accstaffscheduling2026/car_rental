-- ============================================================
-- migrations/001_initial_schema.sql
-- Special Need Vehicle Rental — NSW, Australia
-- ============================================================
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Vehicle catalogue
CREATE TABLE IF NOT EXISTS vehicles (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT    NOT NULL,
  type                TEXT    NOT NULL,  -- 'sedan' | 'wagon' | 'van' | 'wheelchair'
  capacity            INTEGER NOT NULL DEFAULT 1,
  plate               TEXT    UNIQUE,
  accessibility_notes TEXT,
  photos_json         TEXT,              -- JSON array of relative image paths
  hourly_rate_cents   INTEGER NOT NULL DEFAULT 0,
  daily_rate_cents    INTEGER NOT NULL DEFAULT 0,
  buffer_minutes      INTEGER NOT NULL DEFAULT 30,
  status              TEXT    NOT NULL DEFAULT 'active',
                      -- 'active' | 'maintenance' | 'retired'
  maintenance_until   TEXT,              -- ISO UTC
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT
);

-- Customer reservations
CREATE TABLE IF NOT EXISTS reservations (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id          INTEGER NOT NULL REFERENCES vehicles(id),
  customer_name       TEXT    NOT NULL,
  customer_email      TEXT    NOT NULL,
  customer_phone      TEXT    NOT NULL,
  intended_use        TEXT,
  addons_json         TEXT,              -- JSON array of selected add-ons
  start_utc           TEXT    NOT NULL,  -- ISO 8601 UTC
  end_utc             TEXT    NOT NULL,
  status              TEXT    NOT NULL DEFAULT 'pending',
                      -- 'pending' | 'confirmed' | 'picked_up' | 'completed' | 'cancelled'
  price_cents         INTEGER NOT NULL DEFAULT 0,
  gst_cents           INTEGER NOT NULL DEFAULT 0,
  deposit_cents       INTEGER NOT NULL DEFAULT 0,
  payment_status      TEXT    NOT NULL DEFAULT 'none',
                      -- 'none' | 'form_captured' | 'paid' | 'refunded'
  payment_token       TEXT,
  cardholder_name     TEXT,
  card_last4          TEXT,
  expiry_month        TEXT,
  expiry_year         TEXT,
  terms_accepted      INTEGER NOT NULL DEFAULT 0,
  terms_accepted_at   TEXT,
  cancellation_reason TEXT,
  notes               TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT
);

-- Audit log (append-only)
CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  entity      TEXT NOT NULL,
  entity_id   INTEGER NOT NULL,
  action      TEXT NOT NULL,
  actor       TEXT,
  detail_json TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_res_vehicle_time
  ON reservations(vehicle_id, start_utc, end_utc);

CREATE INDEX IF NOT EXISTS idx_res_status
  ON reservations(status);

CREATE INDEX IF NOT EXISTS idx_res_email
  ON reservations(customer_email);
