-- Road Damage Reporting System Database Schema

-- Administrators table
CREATE TABLE IF NOT EXISTS administrators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Damage reports table
CREATE TABLE IF NOT EXISTS damage_reports (
    id TEXT PRIMARY KEY,                          -- UUID
    image_path TEXT NOT NULL,                     -- Path to uploaded image
    latitude REAL NOT NULL,                       -- GPS latitude
    longitude REAL NOT NULL,                      -- GPS longitude
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'analyzing', 'analyzed', 'repaired', 'rejected')),
    
    -- AI analysis results (populated after analysis)
    damage_type TEXT,                             -- e.g., pothole, crack, etc.
    severity TEXT CHECK(severity IN ('low', 'medium', 'high') OR severity IS NULL),
    estimated_cost REAL,                          -- Estimated repair cost
    
    -- Metadata
    description TEXT,                             -- Optional citizen description
    reporter_contact TEXT,                        -- Optional contact info
    
    -- Repair tracking
    repaired_by INTEGER REFERENCES administrators(id),
    repaired_at DATETIME,
    repair_notes TEXT,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    analyzed_at DATETIME
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_status ON damage_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_location ON damage_reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reports_created ON damage_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON damage_reports(severity);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_report_timestamp 
AFTER UPDATE ON damage_reports
BEGIN
    UPDATE damage_reports SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_admin_timestamp 
AFTER UPDATE ON administrators
BEGIN
    UPDATE administrators SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
