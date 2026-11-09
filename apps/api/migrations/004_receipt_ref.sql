-- One receipt, two ways in (docs/09): a scan hashes the day, the till's series and the number; a
-- typed entry has no series, so the same receipt hashed differently and could count for two
-- students. receipt_ref is the hash of what both know, the day and the number. It is not unique
-- (every till restarts its numbers each day): services/loyalty.ts checks it with the total, under
-- a lock on the receipt. Older rows stay NULL; their receipts are from past days, and a receipt
-- only counts on its own day.
ALTER TABLE visits ADD COLUMN receipt_ref text;
CREATE INDEX visits_receipt_ref ON visits (receipt_ref) WHERE receipt_ref IS NOT NULL;
