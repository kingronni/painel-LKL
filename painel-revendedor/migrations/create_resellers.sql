-- 1. Create Resellers Table
CREATE TABLE IF NOT EXISTS resellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  secret_key TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add 'reseller_id' to licenses table (linking generated keys to resellers)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='licenses' AND column_name='reseller_id') THEN
        ALTER TABLE licenses ADD COLUMN reseller_id UUID REFERENCES resellers(id);
    END IF;
END $$;

-- 3. Insert a demo reseller (You can delete this later)
INSERT INTO resellers (name, secret_key)
VALUES ('Demo Reseller', 'DEMO-123')
ON CONFLICT (secret_key) DO NOTHING;
