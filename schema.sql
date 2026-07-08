-- Hiring managers / contacts found via LinkedIn
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  linkedin_url TEXT UNIQUE,
  name TEXT,
  title TEXT,
  company TEXT,
  location TEXT,
  email TEXT,
  connection_status TEXT DEFAULT 'none', -- none | pending | connected
  dm_status TEXT DEFAULT 'none',         -- none | sent | replied
  notes TEXT,
  found_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Job applications tracked in the CRM
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER REFERENCES contacts(id),
  source TEXT NOT NULL,                  -- linkedin_job | linkedin_dm | instagram | agency
  job_title TEXT,
  company TEXT,
  job_url TEXT,
  country TEXT,
  stage TEXT DEFAULT 'found',            -- found | outreach_sent | replied | interviewing | offer | rejected | closed
  connect_sent_at TEXT,
  dm_sent_at TEXT,
  email_sent_at TEXT,
  description TEXT,                      -- full job description text (parsed from link or screenshot)
  requirements TEXT,                      -- JSON array of key requirements
  apply_url TEXT,                         -- URL of the actual application form, if different from job_url
  resume_generated INTEGER DEFAULT 0,     -- 0/1 — tailored resume PDF was generated
  cover_letter_generated INTEGER DEFAULT 0, -- 0/1 — tailored cover letter PDF was generated
  apply_status TEXT DEFAULT 'none',       -- none | pending | submitted | failed
  applied_at TEXT,                        -- when the Chrome extension submitted the application
  last_activity_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Log of every outreach action taken
CREATE TABLE IF NOT EXISTS outreach_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER REFERENCES applications(id),
  contact_id INTEGER REFERENCES contacts(id),
  channel TEXT NOT NULL,                 -- linkedin_connect | linkedin_dm | email | instagram_dm
  message TEXT,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT DEFAULT 'sent'             -- sent | delivered | replied | failed
);

-- Scrape runs so we don't re-process the same results
CREATE TABLE IF NOT EXISTS scrape_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,                   -- apify actor id used
  query TEXT,                            -- search query / params
  results_count INTEGER DEFAULT 0,
  ran_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications(stage);
CREATE INDEX IF NOT EXISTS idx_applications_country ON applications(country);
