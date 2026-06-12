-- Add per-code discount so each batch can carry its own rate
ALTER TABLE promo_codes ADD COLUMN discount_percent INTEGER NOT NULL DEFAULT 0;
