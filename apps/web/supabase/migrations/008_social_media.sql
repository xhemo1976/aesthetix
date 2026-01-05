-- Social Media Integration Tables
-- Migration: 008_social_media

-- =====================================================
-- 1. Social Media Accounts Table
-- Stores connected social media accounts for each tenant
-- =====================================================
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Platform info
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'google', 'youtube', 'whatsapp')),
  username TEXT,
  profile_url TEXT,
  profile_image_url TEXT,

  -- Authentication
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Platform-specific IDs
  platform_user_id TEXT,
  platform_page_id TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(tenant_id, platform, platform_user_id)
);

-- Index for faster lookups
CREATE INDEX idx_social_accounts_tenant ON public.social_accounts(tenant_id);
CREATE INDEX idx_social_accounts_platform ON public.social_accounts(platform);
CREATE INDEX idx_social_accounts_active ON public.social_accounts(tenant_id, is_active);

-- =====================================================
-- 2. Social Media Posts Cache
-- Caches social media posts to reduce API calls
-- =====================================================
CREATE TABLE IF NOT EXISTS public.social_posts_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,

  -- Post data
  platform TEXT NOT NULL,
  platform_post_id TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  link TEXT,

  -- Engagement metrics
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,

  -- Timing
  posted_at TIMESTAMPTZ NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT now(),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(social_account_id, platform_post_id)
);

-- Indexes
CREATE INDEX idx_social_posts_account ON public.social_posts_cache(social_account_id);
CREATE INDEX idx_social_posts_posted_at ON public.social_posts_cache(posted_at DESC);
CREATE INDEX idx_social_posts_platform ON public.social_posts_cache(platform);

-- =====================================================
-- 3. Social Media Reviews Cache
-- Caches reviews from Google, Facebook, etc.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.social_reviews_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,

  -- Review data
  platform TEXT NOT NULL,
  platform_review_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_image_url TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,

  -- Metrics
  helpful_count INTEGER DEFAULT 0,

  -- Timing
  reviewed_at TIMESTAMPTZ NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT now(),

  -- Response from business
  business_response TEXT,
  business_response_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(social_account_id, platform_review_id)
);

-- Indexes
CREATE INDEX idx_social_reviews_account ON public.social_reviews_cache(social_account_id);
CREATE INDEX idx_social_reviews_rating ON public.social_reviews_cache(rating);
CREATE INDEX idx_social_reviews_reviewed_at ON public.social_reviews_cache(reviewed_at DESC);

-- =====================================================
-- 4. Social Media Analytics
-- Stores aggregated analytics data
-- =====================================================
CREATE TABLE IF NOT EXISTS public.social_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,

  -- Analytics data
  date DATE NOT NULL,

  -- Metrics
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,

  -- Average ratings (for review platforms)
  average_rating DECIMAL(3,2),
  total_reviews INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(social_account_id, date)
);

-- Indexes
CREATE INDEX idx_social_analytics_account ON public.social_analytics(social_account_id);
CREATE INDEX idx_social_analytics_date ON public.social_analytics(date DESC);

-- =====================================================
-- 5. Row Level Security (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_reviews_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for social_accounts
CREATE POLICY "Users can view their tenant's social accounts"
  ON public.social_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.tenant_id = social_accounts.tenant_id
    )
  );

CREATE POLICY "Users can manage their tenant's social accounts"
  ON public.social_accounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.tenant_id = social_accounts.tenant_id
      AND users.role IN ('admin', 'owner')
    )
  );

-- Policies for social_posts_cache
CREATE POLICY "Users can view their tenant's cached posts"
  ON public.social_posts_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.social_accounts sa
      JOIN public.users u ON u.tenant_id = sa.tenant_id
      WHERE sa.id = social_posts_cache.social_account_id
      AND u.id = auth.uid()
    )
  );

-- Policies for social_reviews_cache
CREATE POLICY "Users can view their tenant's cached reviews"
  ON public.social_reviews_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.social_accounts sa
      JOIN public.users u ON u.tenant_id = sa.tenant_id
      WHERE sa.id = social_reviews_cache.social_account_id
      AND u.id = auth.uid()
    )
  );

-- Policies for social_analytics
CREATE POLICY "Users can view their tenant's social analytics"
  ON public.social_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.social_accounts sa
      JOIN public.users u ON u.tenant_id = sa.tenant_id
      WHERE sa.id = social_analytics.social_account_id
      AND u.id = auth.uid()
    )
  );

-- =====================================================
-- 6. Functions and Triggers
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER update_social_posts_cache_updated_at
  BEFORE UPDATE ON public.social_posts_cache
  FOR EACH ROW EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER update_social_reviews_cache_updated_at
  BEFORE UPDATE ON public.social_reviews_cache
  FOR EACH ROW EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER update_social_analytics_updated_at
  BEFORE UPDATE ON public.social_analytics
  FOR EACH ROW EXECUTE FUNCTION update_social_updated_at();

-- =====================================================
-- 7. Helper Functions
-- =====================================================

-- Function to get average rating for a tenant across all platforms
CREATE OR REPLACE FUNCTION get_tenant_average_rating(tenant_uuid UUID)
RETURNS TABLE (
  average_rating DECIMAL,
  total_reviews BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(AVG(src.rating)::numeric, 2) as average_rating,
    COUNT(*) as total_reviews
  FROM public.social_reviews_cache src
  JOIN public.social_accounts sa ON sa.id = src.social_account_id
  WHERE sa.tenant_id = tenant_uuid
  AND sa.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get social media stats for a tenant
CREATE OR REPLACE FUNCTION get_tenant_social_stats(tenant_uuid UUID)
RETURNS TABLE (
  platform TEXT,
  username TEXT,
  followers INTEGER,
  total_posts INTEGER,
  average_engagement DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.platform,
    sa.username,
    COALESCE(latest.followers_count, 0) as followers,
    COUNT(DISTINCT spc.id)::INTEGER as total_posts,
    ROUND(AVG(spc.likes_count + spc.comments_count + spc.shares_count)::numeric, 2) as average_engagement
  FROM public.social_accounts sa
  LEFT JOIN public.social_posts_cache spc ON spc.social_account_id = sa.id
  LEFT JOIN LATERAL (
    SELECT followers_count
    FROM public.social_analytics
    WHERE social_account_id = sa.id
    ORDER BY date DESC
    LIMIT 1
  ) latest ON true
  WHERE sa.tenant_id = tenant_uuid
  AND sa.is_active = true
  GROUP BY sa.id, sa.platform, sa.username, latest.followers_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DONE
-- =====================================================
