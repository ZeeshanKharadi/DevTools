-- InfyraTools Pro MVP schema
-- D1 enforces foreign keys by default. Application-layer ownership checks
-- still run on every read/write. Foreign keys are not authorization.

PRAGMA foreign_keys = ON;

CREATE TABLE business_cards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  public_slug TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  card_data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_business_cards_slug ON business_cards (public_slug);
CREATE INDEX idx_business_cards_user_id ON business_cards (user_id);
CREATE INDEX idx_business_cards_user_updated ON business_cards (user_id, updated_at DESC);

CREATE TABLE dynamic_qr_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  total_scans INTEGER NOT NULL DEFAULT 0,
  last_scanned_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_dynamic_qr_codes_code ON dynamic_qr_codes (code);
CREATE INDEX idx_dynamic_qr_codes_user_id ON dynamic_qr_codes (user_id);
CREATE INDEX idx_dynamic_qr_codes_user_updated ON dynamic_qr_codes (user_id, updated_at DESC);

CREATE TABLE qr_scan_events (
  id TEXT PRIMARY KEY,
  qr_code_id TEXT NOT NULL,
  scanned_at TEXT NOT NULL,
  FOREIGN KEY (qr_code_id) REFERENCES dynamic_qr_codes (id) ON DELETE CASCADE
);

CREATE INDEX idx_qr_scan_events_qr_code_id ON qr_scan_events (qr_code_id);
CREATE INDEX idx_qr_scan_events_scanned_at ON qr_scan_events (qr_code_id, scanned_at DESC);

CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_customers_user_id ON customers (user_id);
CREATE INDEX idx_customers_user_updated ON customers (user_id, updated_at DESC);

CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL,
  currency TEXT NOT NULL,
  invoice_data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_invoices_user_id ON invoices (user_id);
CREATE INDEX idx_invoices_user_updated ON invoices (user_id, updated_at DESC);
CREATE INDEX idx_invoices_user_number ON invoices (user_id, invoice_number);

CREATE TABLE business_profiles (
  user_id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
