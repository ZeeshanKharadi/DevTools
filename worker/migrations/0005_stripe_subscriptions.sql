-- Stripe subscriptions for InfyraTools Pro.
-- Card/payment details are never stored. Foreign keys are not authorization.

PRAGMA foreign_keys = ON;

ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;

CREATE UNIQUE INDEX idx_users_stripe_customer_id
  ON users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TEXT NOT NULL,
  current_period_end TEXT NOT NULL,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_subscriptions_user_id
  ON subscriptions (user_id);

CREATE UNIQUE INDEX idx_subscriptions_stripe_subscription_id
  ON subscriptions (stripe_subscription_id);

CREATE INDEX idx_subscriptions_stripe_customer_id
  ON subscriptions (stripe_customer_id);

CREATE INDEX idx_subscriptions_status
  ON subscriptions (status);

CREATE TABLE processed_stripe_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TEXT NOT NULL
);
