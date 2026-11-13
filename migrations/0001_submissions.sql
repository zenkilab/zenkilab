CREATE TABLE IF NOT EXISTS submissions (
 ref TEXT PRIMARY KEY, digest TEXT NOT NULL, product TEXT NOT NULL, stage TEXT NOT NULL,
 state TEXT NOT NULL, payload TEXT NOT NULL, artifacts TEXT NOT NULL, validation TEXT NOT NULL,
 created INTEGER NOT NULL, updated INTEGER NOT NULL, expires INTEGER NOT NULL,
 provider_id TEXT, failure TEXT, lease INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS submissions_expiry ON submissions(expires);
CREATE TABLE IF NOT EXISTS submission_rate (bucket TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS submission_scope (id INTEGER PRIMARY KEY CHECK(id=1), namespace TEXT NOT NULL);
INSERT OR IGNORE INTO submission_scope(id,namespace) VALUES(1,'preview/feature-automotive-keytags-logo-catalog');
