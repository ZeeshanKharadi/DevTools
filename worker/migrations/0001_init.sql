-- InfyraTools Pro foundation schema (D1 / SQLite)
--
-- Cloudflare D1 enforces FOREIGN KEY constraints by default.
-- These constraints are still declared explicitly, including ON DELETE
-- CASCADE so deleting a user removes that user's sessions and saved
-- signatures. Foreign keys are not a replacement for application-layer
-- ownership and authorization checks.

PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_users_email ON users (email);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions (user_id);
CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);

CREATE TABLE email_signatures (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  signature_data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_email_signatures_user_id ON email_signatures (user_id);
CREATE INDEX idx_email_signatures_user_updated ON email_signatures (user_id, updated_at DESC);

CREATE TABLE auth_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  key TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_auth_attempts_lookup ON auth_attempts (action, key, created_at);
