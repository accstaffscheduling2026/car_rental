-- ============================================================
-- migrations/004_cancellation_policy_and_refunds.sql
-- Configurable cancellation policy settings + refund request workflow
-- ============================================================

-- Seed cancellation policy settings (default: >48h=100%, 24-48h=50%, <24h=0%)
INSERT OR IGNORE INTO settings (key, value) VALUES ('cancel_full_refund_hours', '48');
INSERT OR IGNORE INTO settings (key, value) VALUES ('cancel_partial_hours',     '24');
INSERT OR IGNORE INTO settings (key, value) VALUES ('cancel_partial_pct',       '50');

-- Refund requests table — created by cancellation, approved/rejected by admin
CREATE TABLE IF NOT EXISTS refund_requests (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id   INTEGER NOT NULL REFERENCES reservations(id),
  refund_cents     INTEGER NOT NULL DEFAULT 0,
  refund_pct       INTEGER NOT NULL DEFAULT 0,
  status           TEXT    NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  stripe_refund_id TEXT,
  notes            TEXT,
  requested_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  reviewed_at      TEXT,
  reviewed_by      TEXT,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_refund_reservation ON refund_requests(reservation_id);
CREATE INDEX IF NOT EXISTS idx_refund_status      ON refund_requests(status);
