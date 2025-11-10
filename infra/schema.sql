-- Viralit-YT Database Schema
-- Apply to Supabase or Neon Postgres

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- API Projects (Google Cloud projects for quota rotation)
CREATE TABLE api_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  daily_quota INT NOT NULL DEFAULT 10000,
  quota_used_today INT NOT NULL DEFAULT 0,
  quota_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW()::DATE + INTERVAL '1 day'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Themes (topic categories)
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  search_keywords TEXT[] DEFAULT '{}',
  default_hashtags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- YouTube Accounts (channels we manage)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  channel_id TEXT,
  theme_slug TEXT NOT NULL REFERENCES themes(slug),
  active BOOLEAN NOT NULL DEFAULT true,
  oauth_refresh_token TEXT NOT NULL,
  api_project_id UUID NOT NULL REFERENCES api_projects(id),
  upload_time_1 TIME NOT NULL DEFAULT '10:00:00',
  upload_time_2 TIME NOT NULL DEFAULT '18:00:00',
  generator_account_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_theme ON accounts(theme_slug);
CREATE INDEX idx_accounts_active ON accounts(active);

-- Videos (source content - SOLO SHORTS)
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_platform TEXT NOT NULL DEFAULT 'youtube',
  source_video_id TEXT NOT NULL,
  title TEXT,
  channel_title TEXT,
  thumbnail_url TEXT,
  views BIGINT,
  duration_seconds INT,
  theme_slug TEXT NOT NULL REFERENCES themes(slug),
  picked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_video_id)
);

CREATE INDEX idx_videos_theme ON videos(theme_slug, created_at DESC);
CREATE INDEX idx_videos_picked ON videos(picked, theme_slug);

-- Roblox generator projects (tracks generated content assignments)
-- Uploads (the job queue)
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id),
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_for TIMESTAMPTZ NOT NULL,
  run_id TEXT,
  youtube_video_id TEXT,
  title TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 3,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_uploads_status ON uploads(status, scheduled_for);
CREATE INDEX idx_uploads_account ON uploads(account_id, scheduled_for DESC);
CREATE INDEX idx_uploads_run ON uploads(run_id);

-- Upload History
CREATE TABLE upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES uploads(id),
  status TEXT NOT NULL,
  run_id TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_upload_history_upload ON upload_history(upload_id, created_at DESC);

-- Quota History
CREATE TABLE quota_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_project_id UUID NOT NULL REFERENCES api_projects(id),
  operation TEXT NOT NULL,
  cost INT NOT NULL,
  quota_before INT NOT NULL,
  quota_after INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quota_history_project ON quota_history(api_project_id, created_at DESC);

-- Roblox generator projects (tracks generated content assignments)
CREATE TABLE roblox_projects (
  generator_project_id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id),
  upload_id UUID REFERENCES uploads(id),
  storage_path TEXT NOT NULL,
  video_url TEXT,
  primary_video_id TEXT,
  secondary_video_id TEXT,
  status TEXT NOT NULL DEFAULT 'ready',
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_roblox_projects_account_primary
  ON roblox_projects(account_id, primary_video_id)
  WHERE primary_video_id IS NOT NULL;

CREATE INDEX idx_roblox_projects_status ON roblox_projects(status);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uploads_updated_at BEFORE UPDATE ON uploads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roblox_projects_updated_at BEFORE UPDATE ON roblox_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

