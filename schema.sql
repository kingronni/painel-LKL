-- Create the table for licenses (if it doesn't exist)
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT UNIQUE NOT NULL,
    client_username TEXT,
    client_password TEXT,
    whatsapp TEXT,
    status TEXT CHECK (status IN ('active', 'banned', 'expired', 'frozen')),
    duration_type TEXT CHECK (duration_type IN ('daily', 'weekly', 'monthly', 'permanent', 'custom')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    locked_ip TEXT, -- Deprecated in favor of used_ips
    max_ips INTEGER DEFAULT 1,
    used_ips JSONB DEFAULT '[]'::jsonb
);

-- Ensure columns exist (safe to run even if table exists)
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS client_username TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS client_password TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS max_ips INTEGER DEFAULT 1;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS used_ips JSONB DEFAULT '[]'::jsonb;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS order_id TEXT;

-- Create settings table for global server status
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB
);

-- Insert default server status if not exists
INSERT INTO settings (key, value) VALUES ('server_status', '{"enabled": true}') ON CONFLICT DO NOTHING;

-- Create an index on license_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_license_key ON licenses(license_key);

-- Optional: Row Level Security (RLS) policies
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists to avoid error on recreation
DROP POLICY IF EXISTS "Enable all access for all users" ON licenses;
DROP POLICY IF EXISTS "Enable all access for all users" ON settings;

CREATE POLICY "Enable all access for all users" ON licenses
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for all users" ON settings
FOR ALL USING (true) WITH CHECK (true);
