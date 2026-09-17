-- Email verification for new registrations.
-- Existing users are marked verified so current production accounts keep working.
-- OTP values are stored only as hashes. Foreign keys are not authorization.

PRAGMA foreign_keys = ON;

ALTER TABLE users ADD COLUMN email_verified_at TEXT;

UPDATE users
SET email_verified_at = created_at
WHERE email_verified_at IS NULL;

CREATE TABLE email_verification_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_email_verification_user_id
  ON email_verification_challenges (user_id);

CREATE INDEX idx_email_verification_user_active
  ON email_verification_challenges (user_id, consumed_at, expires_at);
