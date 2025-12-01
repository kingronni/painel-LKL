-- Create the table for licenses
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT UNIQUE NOT NULL,
    client_username TEXT,
    client_password TEXT,
    status TEXT CHECK (status IN ('active', 'banned', 'expired', 'frozen')),
    duration_type TEXT CHECK (duration_type IN ('daily', 'weekly', 'monthly', 'permanent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    locked_ip TEXT -- Nullable, will be filled on first use
);

-- Create an index on license_key for faster lookups
CREATE INDEX idx_license_key ON licenses(license_key);

-- Optional: Row Level Security (RLS) policies
-- For a simple admin panel, you might want to enable RLS but allow public access for now 
-- or configure it to only allow the admin app to write.
-- For this demo, we will enable RLS but allow all operations for simplicity of testing,
-- BUT in production you should lock this down.
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON licenses
FOR ALL USING (true) WITH CHECK (true);
