-- Additive. No R2 subscription or public object storage is required.
CREATE TABLE IF NOT EXISTS submission_storage_budget (
 id INTEGER PRIMARY KEY CHECK(id=1), used_bytes INTEGER NOT NULL DEFAULT 0 CHECK(used_bytes>=0),
 limit_bytes INTEGER NOT NULL DEFAULT 67108864 CHECK(limit_bytes BETWEEN 1048576 AND 134217728)
);
INSERT OR IGNORE INTO submission_storage_budget(id) VALUES(1);
CREATE TABLE IF NOT EXISTS submission_files (
 key TEXT PRIMARY KEY, ref TEXT NOT NULL REFERENCES submissions(ref), name TEXT NOT NULL,
 size INTEGER NOT NULL CHECK(size>0 AND size<=3145728), sha TEXT NOT NULL CHECK(length(sha)=64),
 chunks INTEGER NOT NULL CHECK(chunks BETWEEN 1 AND 12), type TEXT NOT NULL, expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS submission_files_ref ON submission_files(ref);
CREATE TABLE IF NOT EXISTS submission_file_chunks (
 file_key TEXT NOT NULL REFERENCES submission_files(key) ON DELETE CASCADE,
 part INTEGER NOT NULL CHECK(part BETWEEN 0 AND 11), data BLOB NOT NULL CHECK(length(data) BETWEEN 1 AND 262144),
 PRIMARY KEY(file_key,part)
) WITHOUT ROWID;
CREATE TRIGGER IF NOT EXISTS submission_file_quota BEFORE INSERT ON submission_files BEGIN
 SELECT CASE WHEN (SELECT used_bytes+NEW.size>limit_bytes FROM submission_storage_budget WHERE id=1)
 THEN RAISE(ABORT,'Private attachment capacity reached') END;
END;
CREATE TRIGGER IF NOT EXISTS submission_file_account_insert AFTER INSERT ON submission_files BEGIN
 UPDATE submission_storage_budget SET used_bytes=used_bytes+NEW.size WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS submission_file_account_delete AFTER DELETE ON submission_files BEGIN
 UPDATE submission_storage_budget SET used_bytes=used_bytes-OLD.size WHERE id=1;
END;
CREATE TRIGGER IF NOT EXISTS submission_metadata_capacity BEFORE INSERT ON submissions
WHEN (SELECT count(*) FROM submissions)>=10000 AND NOT EXISTS(SELECT 1 FROM submissions WHERE ref=NEW.ref) BEGIN
 SELECT RAISE(ABORT,'Submission metadata capacity reached');
END;
CREATE TABLE IF NOT EXISTS submission_daily_budget(day TEXT PRIMARY KEY, hits INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS submission_email_budget(period TEXT PRIMARY KEY, hits INTEGER NOT NULL);
CREATE TRIGGER IF NOT EXISTS submission_rate_capacity BEFORE INSERT ON submission_rate
WHEN (SELECT count(*) FROM submission_rate)>=10000 AND NOT EXISTS(SELECT 1 FROM submission_rate WHERE bucket=NEW.bucket) BEGIN
 SELECT RAISE(ABORT,'Rate metadata capacity reached');
END;
