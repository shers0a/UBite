-- Counts that start again every day, kept in the database so every instance and every restart
-- agrees (services/alerts.ts): wrong sign-in codes per address, whose key carries a hash of the
-- address and never the address itself, and the sign-in emails sent, against the provider's daily
-- quota (docs/10). The nightly job deletes rows older than a week.
CREATE TABLE daily_counters (
  day date NOT NULL,
  key text NOT NULL,
  n integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, key)
);
