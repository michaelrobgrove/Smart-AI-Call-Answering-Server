-- scripts/01-create-tables.sql

-- Admin and System Settings
CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE,
    full_name TEXT NOT NULL, -- This was the missing column
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contacts and Calls
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    company TEXT,
    phone_number TEXT NOT NULL UNIQUE,
    email TEXT,
    is_spam BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS call_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER,
    call_id TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    direction TEXT CHECK(direction IN ('inbound', 'outbound')) NOT NULL,
    status TEXT CHECK(status IN ('in-progress', 'answered', 'missed', 'transferred', 'spam', 'voicemail')) NOT NULL,
    duration INTEGER DEFAULT 0,
    transcript TEXT,
    summary TEXT,
    lead_qualified BOOLEAN DEFAULT 0,
    caller_name TEXT,
    caller_company TEXT,
    reason_for_call TEXT,
    transferred_to_human BOOLEAN DEFAULT 0,
    started_at DATETIME NOT NULL,
    ended_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

-- AI and Knowledge Base
CREATE TABLE IF NOT EXISTS knowledge_base (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT DEFAULT 'General',
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

