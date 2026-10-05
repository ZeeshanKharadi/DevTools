-- Password reset challenges. Tokens are stored only as hashes.
-- Foreign keys are not authorization.

PRAGMA foreign_keys = ON;

CREATE TABLE password_reset_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_user_id
  ON password_reset_challenges (user_id);

CREATE INDEX idx_password_reset_token_active
  ON password_reset_challenges (token_hash, consumed_at, expires_at);
