-- ============================================================
-- migrations/002_employees_and_codes.sql
-- Employee table and booking codes for staff discount/free hire
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  emp_id     TEXT    NOT NULL UNIQUE,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL UNIQUE,
  phone      TEXT,
  status     TEXT    NOT NULL DEFAULT 'active',   -- 'active' | 'inactive'
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS booking_codes (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  code                 TEXT    NOT NULL UNIQUE,
  employee_id          INTEGER NOT NULL REFERENCES employees(id),
  generated_by         TEXT    NOT NULL DEFAULT 'admin',  -- admin username who generated
  status               TEXT    NOT NULL DEFAULT 'active', -- 'active' | 'used' | 'expired' | 'disabled'
  expires_at           TEXT    NOT NULL,                  -- ISO UTC, 24 hours after generation
  used_at              TEXT,                              -- ISO UTC when redeemed
  used_reservation_id  INTEGER REFERENCES reservations(id),
  created_at           TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_codes_code       ON booking_codes(code);
CREATE INDEX IF NOT EXISTS idx_codes_employee   ON booking_codes(employee_id);
CREATE INDEX IF NOT EXISTS idx_codes_status     ON booking_codes(status);
CREATE INDEX IF NOT EXISTS idx_emp_emp_id       ON employees(emp_id);
