-- User accounts (customer portal)
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Post-rental feedback (linked to reservations by reservation_id)
CREATE TABLE IF NOT EXISTS booking_feedback (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id),
  rating         INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
