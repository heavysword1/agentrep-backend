-- AgentRep tables

CREATE TABLE IF NOT EXISTS agents_rep (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT UNIQUE NOT NULL,
  wallet_address TEXT,
  display_name TEXT,
  description TEXT,
  score FLOAT DEFAULT 50.0,
  endorsements INT DEFAULT 0,
  reports INT DEFAULT 0,
  tx_count INT DEFAULT 0,
  registered_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rep_endorsements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_agent_id TEXT NOT NULL,
  to_agent_id TEXT NOT NULL,
  comment TEXT,
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rep_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_agent_id TEXT NOT NULL,
  to_agent_id TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agents_rep ENABLE ROW LEVEL SECURITY;
ALTER TABLE rep_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE rep_reports ENABLE ROW LEVEL SECURITY;

-- Allow all reads and writes (API controls access)
CREATE POLICY "Allow all" ON agents_rep FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON rep_endorsements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON rep_reports FOR ALL USING (true) WITH CHECK (true);
