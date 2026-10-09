CREATE TABLE game_runs (
 id TEXT PRIMARY KEY NOT NULL,
 token_hash TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 version TEXT NOT NULL,
 field_id TEXT NOT NULL,
 institution TEXT NOT NULL,
 lab_mode TEXT NOT NULL
);
CREATE TABLE game_months (
 run_id TEXT NOT NULL REFERENCES game_runs(id) ON DELETE CASCADE,
 month INTEGER NOT NULL,
 record TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 PRIMARY KEY (run_id, month)
);
CREATE INDEX game_runs_expiry ON game_runs(expires_at);
