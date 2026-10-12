-- Existing rows stay identifiable as legacy NULL-policy data until an
-- authorized runtime cleanup. Schema migrations never copy or delete records.
ALTER TABLE game_runs ADD COLUMN consent_version TEXT;
ALTER TABLE game_runs ADD COLUMN retention_until INTEGER;
ALTER TABLE game_runs ADD COLUMN edition TEXT CHECK (edition IN ('ko', 'en'));
CREATE INDEX game_runs_retention ON game_runs(consent_version, retention_until);
